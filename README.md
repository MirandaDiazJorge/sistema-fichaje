# Sistema de Fichaje Pro - Control Horario

Aplicación web responsive (Mobile-First) para el control horario de empleados, diseñada para ser empaquetada fácilmente con Capacitor/Cordova o usada directamente en el navegador.

## 🚀 Características

- **Login Seguro**: Autenticación JWT y contraseñas hasheadas con bcrypt.
- **Fichaje de Entrada/Salida**: Registro exacto de horas.
- **Cálculo Automático**: Cálculo de horas trabajadas (soporta turnos nocturnos).
- **Almacenamiento en Excel**: Los fichajes se guardan automáticamente en `fichajes.xlsx` con control de concurrencia.
- **Panel Admin**: Visualización completa y descarga del archivo Excel.
- **Diseño Premium**: Estética moderna con Glassmorphism y degradados suaves.

## 🛠️ Requisitos

- Node.js (v16 o superior)
- npm o yarn

## 📦 Instalación y Ejecución

### 1. Clonar o descargar el proyecto
Sitúate en la carpeta del proyecto `sistema-fichaje`.

### 2. Configurar el Backend
```bash
cd backend
npm install
npm start
```
El servidor se ejecutará en http://localhost:3001. Se creará automáticamente un archivo `database.sqlite` y el archivo `fichajes.xlsx`.

### 3. Configurar el Frontend
Abre una nueva terminal en la carpeta del proyecto:
```bash
cd frontend
npm install
npm run dev
```
La aplicación estará disponible en http://localhost:5173 (o el puerto que indique Vite).

## 👤 Usuarios por Defecto (Seed)

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Admin | `admin` | `admin1234` |

> [!TIP]
> **Cómo cambiar la contraseña de Admin**: 
> Puedes cambiarla en el archivo `backend/db.js` antes de la primera ejecución, o creando un endpoint de actualización de perfil (opcional).

## 📄 Estructura de Datos (Excel)
El archivo `fichajes.xlsx` se genera en la carpeta del backend con las siguientes columnas:
- ID Empleado, Nombre, Fecha, Hora Entrada, Hora Salida, Total Horas (Humano), Total Horas (Decimal), Timestamp, Dispositivo.

## 📱 Empaquetado para Android
Para empaquetar esta web como App Android:
1. Genera el build del frontend: `npm run build` en la carpeta `frontend`.
2. Copia el contenido de `dist` a tu proyecto de Capacitor/Cordova.
3. Asegúrate de configurar la URL del servidor backend en las llamadas de `axios` si vas a desplegarlo en la nube.

## 🔒 Concurrencia
El sistema incluye un sistema de colas (`Queue`) en `excelManager.js` que asegura que nunca se intente escribir en el Excel simultáneamente por dos hilos, evitando así la corrupción del archivo.
