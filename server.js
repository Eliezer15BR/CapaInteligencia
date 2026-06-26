require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json()); // Permite recibir JSON del frontend

// Configuración de Gemini
const apiKey = process.env.API_KEY; // Asegúrate de poner tu llave real
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ 
  model: "gemini-3.1-flash-lite",
  generationConfig: { responseMimeType: "application/json" }
});

// Endpoint principal que consumirá Flutter
app.post('/traducir', async (req, res) => {
  const inputUsuario = req.body.texto;

  if (!inputUsuario) {
    return res.status(400).json({ error: "Falta el campo 'texto' en la petición" });
  }

  const prompt = `
    Eres un sistema estricto de extracción de conceptos semánticos.
    Tu único objetivo es leer la 'Frase del usuario', identificar los conceptos clave y devolver un arreglo en formato JSON.
    
    REGLA 1: Solo puedes usar los IDs de esta lista permitida:
    ["saludar", "tramite", "cedula_identidad", "esperar", "firma", "fecha", "ventanilla", "gracias", "no_entender"]
    
    REGLA 2: Si el usuario menciona algo que no está en la lista, IGNÓRALO. No inventes IDs nuevos.
    REGLA 3: Tu respuesta debe ser EXCLUSIVAMENTE el arreglo JSON. Nada de texto adicional.
    
    Frase del usuario: "${inputUsuario}"
  `;

  try {
    const result = await model.generateContent(prompt);
    const dataParsed = JSON.parse(result.response.text());
    
    // Si la IA devuelve un arreglo vacío, forzamos el fallback
    if (dataParsed.length === 0) {
        return res.json(["deletreo_fallback"]);
    }

    res.json(dataParsed);

  } catch (error) {
    console.error("Error en la API:", error.message);
    res.status(500).json(["deletreo_fallback"]); // Fallback general de seguridad
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de IA corriendo en http://localhost:${PORT}`);
  console.log(`Dile a Flutter que envíe un POST a http://localhost:${PORT}/traducir`);
});