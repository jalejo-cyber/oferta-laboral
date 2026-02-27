import nodemailer from "nodemailer";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const form = formidable({
      multiples: false,
      allowEmptyFiles: false,
      minFileSize: 1,
    });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    // VALIDACIÓ BACKEND EXTRA (seguretat)
    const requiredFields = [
      "dataOferta",
      "empresa",
      "cif",
      "raoSocial",
      "personaContacte",
      "mailContacte",
      "telefon",
      "llocTreball",
      "funcions",
      "vacants",
      "tipusContracte"
    ];

    for (const field of requiredFields) {
      if (!fields[field]) {
        return res.status(400).json({ error: `Falta el camp ${field}` });
      }
    }

    if (!files.fileInput) {
      return res.status(400).json({ error: "El PDF és obligatori" });
    }

    const file = Array.isArray(files.fileInput)
      ? files.fileInput[0]
      : files.fileInput;

    const attachments = [
      {
        filename: file.originalFilename || "oferta.pdf",
        content: fs.readFileSync(file.filepath),
      },
    ];

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Agència de Col·locació" <${process.env.EMAIL_USER}>`,
      to: "jalejo@fomentformacio.com",
      subject: "Nova vacant - Agència de col·locació",
      text: `
NOVA OFERTA LABORAL

Data oferta: ${fields.dataOferta}
Empresa: ${fields.empresa}
CIF: ${fields.cif}
Raó Social: ${fields.raoSocial}
Persona de contacte: ${fields.personaContacte}
Mail contacte: ${fields.mailContacte}
Telèfon: ${fields.telefon}
Denominació lloc de treball: ${fields.llocTreball}
Funcions: ${fields.funcions}
Nombre de vacants: ${fields.vacants}
Tipus de contracte: ${fields.tipusContracte}
      `,
      attachments,
    });

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("ERROR:", err);
    return res.status(500).json({ error: "Error intern del servidor" });
  }
}
