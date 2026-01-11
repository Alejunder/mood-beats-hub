# Proyecto: FRONTEND + BACKEND  
**Frontend:** React + Vite + JavaScript  
**Backend:** Supabase (acceso exclusivo vía MCP de Supabase)

---

## Principios Generales
- **KISS**: escribir la solución más simple y legible.
- **YAGNI**: no crear abstracciones de uso único.
- **DRY**: reutilizar por composición y módulos, no dentro del JSX.
- **SOLID**:  
  - Frontend → un componente = una intención visual.  
  - Backend → una función = una responsabilidad clara.

---

## JavaScript
- Usar `const` y `let`; **nunca `var`**.
- Template literals y arrow functions para callbacks.
- Usar punto y coma y formateo con Prettier.
- `try/catch` obligatorio en operaciones async (frontend y backend).

---

## React (Frontend)
- Componentes funcionales con hooks.
- No hooks condicionales.
- Componentes pequeños y compuestos.
- Separar:
  - **UI pura**
  - **Lógica**
  - **Acceso a datos (facades / services)**
- JSX solo está permitido en componentes visuales de React.
- Cualquier archivo de backend, service, facade, query o command debe ser JS puro.
- Si un archivo no renderiza JSX, debe ser `.js`, nunca `.jsx`.

---

## CSS
- Clases descriptivas y consistentes.
- Sin IDs para estilos.
- Preferir CSS Modules o clases utilitarias.
- Consistencia visual entre componentes.

---

## Backend – Supabase (vía MCP)

### Acceso
- Todo acceso al backend debe hacerse **exclusivamente a través del MCP de Supabase**.
- Nunca llamar directamente a endpoints REST manuales.
- Nunca duplicar lógica del backend en el frontend.

---

### Arquitectura Backend
- Usar Supabase como:
  - Base de datos (PostgreSQL)
  - Auth
  - Storage
  - Edge Functions (si aplica)

- Separar claramente:
  - **Queries (lectura)**
  - **Commands (mutaciones)**
  - **Policies (RLS)**

---

### Base de Datos (PostgreSQL)
- Tablas con nombres en `snake_case`.
- Columnas claras y semánticas.
- Usar:
  - `uuid` como PK
  - `created_at`, `updated_at` cuando aplique
- Evitar tablas genéricas tipo `data`, `items`, `misc`.

---

### Row Level Security (RLS)
- RLS **siempre activado**.
- Policies explícitas:
  - `select`
  - `insert`
  - `update`
  - `delete`
- Nunca confiar en validaciones solo del frontend.

---

### Funciones y RPC
- Usar funciones SQL (`rpc`) cuando:
  - La lógica sea de dominio.
  - Involucre múltiples tablas.
  - Requiera transacciones.
- Funciones pequeñas, predecibles y testeables.

---

### Auth
- Usar Supabase Auth como fuente única de identidad.
- No duplicar lógica de sesión.
- Validar `auth.uid()` siempre que aplique en RLS o funciones.

---

### Edge Functions (si se usan)
- Una función = un caso de uso.
- Sin lógica UI.
- Sin dependencias innecesarias.
- Respuestas claras y tipadas.

---

### Manejo de Errores
- Errores explícitos y semánticos.
- No exponer mensajes internos de SQL al frontend.
- El frontend **solo interpreta**, no corrige lógica backend.

---

## Comunicación Frontend ↔ Backend
- El frontend accede al backend **solo mediante facades o services**.
- Nunca llamar Supabase directamente desde JSX.
- Centralizar:
  - queries
  - mutations
  - auth
- El componente **consume datos**, no decide reglas.

---

## Patrones Permitidos – Frontend
- Singleton → solo stores y facades  
- Module → ES modules autocontenidos  
- Observer → comunicación desacoplada  
- Signals → estado reactivo ligero  
- Factory → creación de comandos/estrategias  
- Strategy → reglas UX intercambiables  
- Decorator → extender funciones UI  
- Proxy → control de acceso a libs  
- Facade → API simple al componente  
- Command → acciones del usuario  
- Mediator → orquestar módulos  
- Iterator → galerías y colecciones  

---

## Patrones Permitidos – Backend (Supabase)
- **Facade** → capa de acceso a Supabase
- **Command** → mutaciones de datos
- **Query Object** → lecturas complejas
- **Policy-based access** → RLS
- **Transaction Script** → funciones SQL
- **Gateway** → acceso a servicios externos (Edge Functions)

---

## Prohibido – YAGNI (Global)
- Lógica DRY dentro del render.
- Utils genéricos sin dominio.
- `if / switch` gigantes en JSX.
- Singletons para componentes visuales.
- Validaciones críticas solo en frontend.