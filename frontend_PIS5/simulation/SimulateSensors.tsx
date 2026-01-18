import React, { useState } from "react";

const BACKEND_URL = "http://127.0.0.1:8000/send-manual-data";  // Route pour données manuelles

const SimulateSensors: React.FC = () => {
  const [temperature, setTemperature] = useState(25);
  const [light, setLight] = useState(50000);
  const [windSpeed, setWindSpeed] = useState(10);
  const [rainfall, setRainfall] = useState(false);
  const [rainfallIntensity, setRainfallIntensity] = useState("none");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  // Humidité du sol saisie manuellement
  const [soilMoisture10cm, setSoilMoisture10cm] = useState(45);
  const [soilMoisture30cm, setSoilMoisture30cm] = useState(55);
  const [soilMoisture60cm, setSoilMoisture60cm] = useState(65);
  const [humidityAir, setHumidityAir] = useState(60);

  // État de la pompe
  const [pumpActive, setPumpActive] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    setResponse(null);

    const payload = {
      zone_id: "zone-1",
      humidity: humidityAir,
      temperature,
      soil_moisture: soilMoisture10cm,
      soil_moisture_10cm: soilMoisture10cm,
      soil_moisture_30cm: soilMoisture30cm,
      soil_moisture_60cm: soilMoisture60cm,
      light,
      wind_speed: windSpeed,
      rainfall,
      rainfall_intensity: rainfallIntensity,
      pump_was_active: pumpActive,
    };

    try {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setResponse(data);
        setPumpActive(data.pump); // Mettre à jour l'état de la pompe
      } else {
        setResponse({ error: `Erreur HTTP ${res.status}` });
      }
    } catch (error) {
      setResponse({ error: "Backend non accessible" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: "700px", 
      margin: "50px auto", 
      padding: "40px", 
      backgroundColor: "#fff", 
      borderRadius: "20px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
    }}>
      <h2 style={{ 
        color: "#4A90E2", 
        marginBottom: "30px",
        display: "flex",
        alignItems: "center",
        gap: "10px"
      }}>
        🌱 Simulation des capteurs
      </h2>

      {/* Température */}
      <div style={{ marginBottom: "25px" }}>
        <label style={{ fontSize: "18px", fontWeight: "600", display: "block", marginBottom: "10px" }}>
          🌡️ Température (°C): <strong>{temperature}</strong>
        </label>
        <input
          type="range"
          min="-10"
          max="50"
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
          style={{ width: "100%", height: "8px", cursor: "pointer" }}
        />
      </div>

      {/* Lumière */}
      <div style={{ marginBottom: "25px" }}>
        <label style={{ fontSize: "18px", fontWeight: "600", display: "block", marginBottom: "10px" }}>
          ☀️ Lumière (lux): <strong>{light}</strong>
        </label>
        <input
          type="range"
          min="0"
          max="100000"
          step="1000"
          value={light}
          onChange={(e) => setLight(Number(e.target.value))}
          style={{ width: "100%", height: "8px", cursor: "pointer" }}
        />
      </div>

      {/* Humidité de l'air */}
      <div style={{ marginBottom: "25px" }}>
        <label style={{ fontSize: "18px", fontWeight: "600", display: "block", marginBottom: "10px" }}>
          💧 Humidité de l'air (%): <strong>{humidityAir}</strong>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={humidityAir}
          onChange={(e) => setHumidityAir(Number(e.target.value))}
          style={{ width: "100%", height: "8px", cursor: "pointer" }}
        />
      </div>

      {/* Humidité du sol - 10cm */}
      <div style={{ marginBottom: "25px" }}>
        <label style={{ fontSize: "18px", fontWeight: "600", display: "block", marginBottom: "10px" }}>
          🌱 Humidité du sol 10cm (%): <strong>{soilMoisture10cm}</strong>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={soilMoisture10cm}
          onChange={(e) => setSoilMoisture10cm(Number(e.target.value))}
          style={{ width: "100%", height: "8px", cursor: "pointer" }}
        />
      </div>

      {/* Humidité du sol - 30cm */}
      <div style={{ marginBottom: "25px" }}>
        <label style={{ fontSize: "18px", fontWeight: "600", display: "block", marginBottom: "10px" }}>
          🌱 Humidité du sol 30cm (%): <strong>{soilMoisture30cm}</strong>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={soilMoisture30cm}
          onChange={(e) => setSoilMoisture30cm(Number(e.target.value))}
          style={{ width: "100%", height: "8px", cursor: "pointer" }}
        />
      </div>

      {/* Humidité du sol - 60cm */}
      <div style={{ marginBottom: "25px" }}>
        <label style={{ fontSize: "18px", fontWeight: "600", display: "block", marginBottom: "10px" }}>
          🌱 Humidité du sol 60cm (%): <strong>{soilMoisture60cm}</strong>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={soilMoisture60cm}
          onChange={(e) => setSoilMoisture60cm(Number(e.target.value))}
          style={{ width: "100%", height: "8px", cursor: "pointer" }}
        />
      </div>

      {/* Lumière */}
      <div style={{ marginBottom: "25px" }}>
        <label style={{ fontSize: "18px", fontWeight: "600", display: "block", marginBottom: "10px" }}>
          ☀️ Lumière (lux): <strong>{light}</strong>
        </label>
        <input
          type="range"
          min="0"
          max="100000"
          step="1000"
          value={light}
          onChange={(e) => setLight(Number(e.target.value))}
          style={{ width: "100%", height: "8px", cursor: "pointer" }}
        />
      </div>

      {/* Vitesse du vent */}
      <div style={{ marginBottom: "25px" }}>
        <label style={{ fontSize: "18px", fontWeight: "600", display: "block", marginBottom: "10px" }}>
          🌬️ Vitesse du vent (km/h): <strong>{windSpeed}</strong>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={windSpeed}
          onChange={(e) => setWindSpeed(Number(e.target.value))}
          style={{ width: "100%", height: "8px", cursor: "pointer" }}
        />
      </div>

      {/* Pluie */}
      <div style={{ marginBottom: "25px" }}>
        <label style={{ fontSize: "18px", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="checkbox"
            checked={rainfall}
            onChange={(e) => {
              setRainfall(e.target.checked);
              if (!e.target.checked) setRainfallIntensity("none");
            }}
            style={{ width: "20px", height: "20px", cursor: "pointer" }}
          />
          🌧️ Pluie
        </label>
      </div>

      {/* Intensité de la pluie */}
      <div style={{ marginBottom: "30px" }}>
        <label style={{ fontSize: "18px", fontWeight: "600", display: "block", marginBottom: "10px" }}>
          Intensité de la pluie:
        </label>
        <select
          value={rainfallIntensity}
          onChange={(e) => setRainfallIntensity(e.target.value)}
          disabled={!rainfall}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "2px solid #ddd",
            cursor: rainfall ? "pointer" : "not-allowed",
            backgroundColor: rainfall ? "#fff" : "#f5f5f5"
          }}
        >
          <option value="none">Aucune</option>
          <option value="light">Légère</option>
          <option value="moderate">Modérée</option>
          <option value="heavy">Forte</option>
        </select>
      </div>

      {/* Bouton Envoyer */}
      <button
        onClick={handleSend}
        disabled={loading}
        style={{
          width: "100%",
          padding: "15px",
          fontSize: "18px",
          fontWeight: "600",
          color: "#fff",
          backgroundColor: loading ? "#ccc" : "#4A90E2",
          border: "none",
          borderRadius: "10px",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background-color 0.3s"
        }}
      >
        {loading ? "Envoi en cours..." : "Envoyer"}
      </button>

      {/* Réponse du backend */}
      {response && (
        <div style={{
          marginTop: "20px",
          padding: "20px",
          backgroundColor: response.error ? "#fee" : "#e8f5e9",
          borderRadius: "10px",
          borderLeft: response.error ? "4px solid #f44336" : "4px solid #4caf50"
        }}>
          <h3 style={{ marginBottom: "15px", color: "#333" }}>
            {response.error ? "❌ Erreur" : "✅ Décision du système"}
          </h3>
          {response.error ? (
            <p style={{ color: "#d32f2f" }}>{response.error}</p>
          ) : (
            <>
              <p><strong>💦 Pompe:</strong> {response.pump ? "🟢 ACTIVE" : "🔴 INACTIVE"}</p>
              <p><strong>📋 Message:</strong> {response.message}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SimulateSensors;
