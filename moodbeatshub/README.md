# MoodBeatsHub 🎵😊

Una aplicación web moderna que te permite descubrir y gestionar música según tu estado de ánimo, integrada con Spotify.

## 🌟 Características

- 🔐 Autenticación con Spotify OAuth
- 🎨 Interfaz moderna y responsiva
- 😊 Música personalizada basada en estados de ánimo
- 📊 Estadísticas de tus canciones y artistas más escuchados
- 🎵 Acceso a tus playlists de Spotify

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js (v16 o superior)
- Cuenta de Spotify
- Cuenta de Supabase

### Instalación

1. **Clona el repositorio**
   ```bash
   git clone <tu-repo-url>
   cd moodbeatshub
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**
   
   Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:
   ```bash
   VITE_APP_SUPABASE_URL=tu_url_de_supabase
   VITE_APP_SUPABASE_ANON_KEY=tu_anon_key
   ```

4. **Configura la autenticación de Spotify**
   
   Sigue las instrucciones detalladas en [SPOTIFY_AUTH_SETUP.md](./SPOTIFY_AUTH_SETUP.md)

5. **Ejecuta la aplicación**
   ```bash
   npm run dev
   ```

   La aplicación estará disponible en `http://localhost:5173`

## 🔧 Tecnologías Utilizadas

- **React** - Framework de UI
- **Vite** - Build tool y dev server
- **Supabase** - Backend y autenticación
- **Spotify API** - Integración con Spotify
- **CSS3** - Estilos personalizados

## 📁 Estructura del Proyecto

```
moodbeatshub/
├── src/
│   ├── components/
│   │   ├── atoms/          # Componentes pequeños reutilizables
│   │   ├── molecules/      # Componentes medianos
│   │   ├── organisms/      # Componentes complejos
│   │   └── templates/      # Plantillas de página
│   ├── pages/              # Páginas de la aplicación
│   ├── routes/             # Configuración de rutas
│   ├── hooks/              # Custom hooks
│   ├── context/            # Context API
│   ├── supabase/           # Configuración de Supabase
│   ├── database/           # Scripts SQL
│   └── utils/              # Utilidades
├── public/                 # Archivos estáticos
└── ...
```

## 🔐 Configuración de Autenticación

Para configurar la autenticación con Spotify, necesitas:

1. Crear una aplicación en [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Configurar el proveedor de Spotify en Supabase
3. Agregar las credenciales en tu archivo `.env`

Consulta [SPOTIFY_AUTH_SETUP.md](./SPOTIFY_AUTH_SETUP.md) para instrucciones detalladas.

## 📝 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run lint` - Ejecuta el linter

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👥 Autores

- Tu nombre - Desarrollo inicial

## 🙏 Agradecimientos

- Spotify por su API
- Supabase por la infraestructura de backend
- La comunidad de React
