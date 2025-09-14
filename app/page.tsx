"use client";
import React, { useState, useRef, useEffect } from "react";

// Debounce utility
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Weather API fetch utility
async function fetchWeather(city: string) {
  // OpenWeatherMap: replace with your own API key if needed.
  // For demo purposes, we'll fetch from: https://api.openweathermap.org/data/2.5/weather?q={city}&units=metric&appid=demo-key
  // We'll use units=metric for Celsius.
  const apiKey = "b6907d289e10d714a6e88b30761fae22"; // demo key (limited, replace with real in production!)
  const response = await fetch(
    `https://openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`
  );
  if (!response.ok) {
    throw new Error(`Could not fetch weather for "${city}"`);
  }
  return response.json();
}

export default function WeatherDashboard() {
  const [input, setInput] = useState("");
  const debouncedInput = useDebounce(input, 600);
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // For race prevention
  const latestQueryId = useRef(0);

  // Effect to fetch weather when debounced input changes
  useEffect(() => {
    if (!debouncedInput.trim()) {
      setWeather(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setWeather(null);
    const thisQuery = ++latestQueryId.current;

    fetchWeather(debouncedInput.trim())
      .then((data) => {
        if (latestQueryId.current !== thisQuery || cancelled) return;
        if (!data.main || !data.weather) {
          setError(`Weather data incomplete for "${debouncedInput}".`);
          setWeather(null);
        } else {
          setWeather(data);
          setError(null);
          // Log in background (non-blocking).
          fetch("/api/log-search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ city: debouncedInput.trim(), timestamp: new Date().toISOString() })
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        if (latestQueryId.current !== thisQuery || cancelled) return;
        setError(err.message || "Failed to fetch weather.");
        setWeather(null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line
  }, [debouncedInput]);

  return (
    <main style={{ maxWidth: 400, margin: "50px auto", fontFamily: "sans-serif" }}>
      <h1>Weather Dashboard</h1>
      <label htmlFor="city-input" style={{ display: "block", marginBottom: 8 }}>
        Enter city name:
      </label>
      <input
        id="city-input"
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="e.g. Paris"
        style={{ padding: 8, width: "100%", marginBottom: 16, fontSize: 16 }}
        autoComplete="off"
      />
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      {weather && !error && (
        <div style={{ marginTop: 18, padding: 12, border: "1px solid #ccc", borderRadius: 6 }}>
          <div style={{ fontSize: 20, fontWeight: "bold" }}>{weather.name}, {weather.sys?.country}</div>
          <div style={{ fontSize: 36 }}>{Math.round(weather.main.temp)}°C</div>
          <div>{weather.weather[0]?.main}: {weather.weather[0]?.description}</div>
          <div>Humidity: {weather.main.humidity}%</div>
          <div>Wind: {weather.wind.speed} m/s</div>
        </div>
      )}
    </main>
  );
}
