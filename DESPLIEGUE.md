# Guia de Despliegue con Base de Datos Externa (PostgreSQL)

Para que tus datos no se borren en Render, vamos a usar una base de datos externa gratuita.

## 1. Crear Base de Datos en Render
1. Entra en tu panel de Render y pulsa **New** > **PostgreSQL**.
2. Ponle un nombre (ej. `fichaje-db`) y deja todo lo demás por defecto.
3. Elige el plan **Free**.
4. Una vez creada, copia la **Internal Database URL** (o la *External* si vas a conectar desde fuera). La necesitaremos luego.

## 2. Preparar el Repositorio (GitHub)
1. Sube tu código a GitHub como vimos antes. No hace falta que subas los archivos `.sqlite` ni `.xlsx` (se crearán solos).

## 3. Desplegar el Backend (API)
1. En Render: **New** > **Web Service**.
2. Conecta tu repositorio.
3. **Configuración**:
   - **Root Directory**: `backend`
   - **Start Command**: `node index.js`
4. **Environment Variables**:
   - `DATABASE_URL`: (Pega aquí la URL de la base de datos que copiaste en el paso 1).
   - `JWT_SECRET`: (Una frase secreta larga).

## 4. Desplegar el Frontend (Web)
1. En Render: **New** > **Static Site**.
2. **Configuración**:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
3. **Environment Variables**:
   - `VITE_API_URL`: (La URL de tu Web Service de Backend).

## 5. Notas Importantes
- **Persistencia**: Tus usuarios y sesiones ahora están seguros en PostgreSQL.
- **Excel**: El servidor seguirá generando el `fichajes.xlsx` en su disco interno. Podrás descargarlo desde el panel admin, pero recuerda que si el servidor se reinicia, el archivo de disco se limpia (aunque los datos base están a salvo en la base de datos).
