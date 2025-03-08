# GraphDB (Graph Database) + RBAC

Base de datos gráfica cliente-servidor con control de acceso basado en roles (RBAC), sincronización P2P y almacenamiento en OPFS.

---

[![](https://data.jsdelivr.com/v1/package/npm/gdb-p2p/badge)](https://www.jsdelivr.com/package/npm/gdb-p2p)

## Características Principales

### ✅ **Núcleo de GraphDB**

- Almacenamiento eficiente en OPFS
- Sincronización en tiempo real entre pestañas y dispositivos
- Operaciones CRUD para nodos y relaciones
- Serialización comprimida con MessagePack
- Indexación automática para búsquedas rápidas

## Advertencia
Este proyecto está en desarrollo activo. No lo uses en entornos de producción hasta que alcance la fase beta o estable. Consulta la sección [Estado del Proyecto](#estado-del-proyecto) para más detalles.

## Estado del Proyecto
- **Fase**: Alfa
- **Funcionalidades Completadas**:
  - Consultas básicas.
  - Almacenamiento distribuido.
- **Funcionalidades Pendientes**:
  - Módulo de resolución de conflictos.
  - Optimización de rendimiento.

### ✅ **Sistema de Roles (RBAC)**

- Jerarquía de roles personalizable (`superadmin`, `admin`, etc)
- Autenticación con Metamask
- Permisos granulares (`read`/`write`/`delete`/`publish`)
- Asignación de roles con caducidad automática
- Verificación criptográfica de transacciones

### ✅ **Seguridad**

- Firma digital de operaciones críticas
- Validación de permisos en tiempo real
- Almacenamiento seguro de roles en grafo interno

---

## Instalación

### 1. Via NPM

```bash
npm install gdb-p2p
```
### 2. Uso directo en navegador

```html
<script type="module">
  import { GraphDB, setCustomRoles, executeWithPermission } from "gdb-p2p";
</script>
```

**Nota**: También puedes usar este paquete directamente desde un navegador importándolo desde un CDN:

```javascript
   // jsDelivr
   import { GraphDB } from "https://cdn.jsdelivr.net/npm/gdb-p2p@latest";

   // UNPKG
   import { GraphDB } from "https://unpkg.com/gdb-p2p@latest";

   // Skypack
   import { GraphDB } from "https://cdn.skypack.dev/gdb-p2p@latest";
```

## Uso Básico

### Inicializar Base de Datos

```javascript
import GraphDB from "gdb-p2p"

const db = new GraphDB("myDatabase")
await db.ready // Esperar inicialización
```

### Operaciones CRUD

```javascript
// Insertar/actualizar nodo
const nodeId = await db.put({ name: "Alice", age: 30 })

// Obtener nodo por ID
const node = await db.get(nodeId)

// Buscar por valor
const found = await db.find({ name: "Alice" })

// Crear relación entre nodos
await db.link(nodeId, "targetNodeId")

// Eliminar nodo
await db.remove(nodeId)
```

## Sistema de Roles

### Configurar Roles Personalizados

```javascript
import { setCustomRoles } from "gdb-p2p"

setCustomRoles({
  editor: {
    can: ["write", "publish"],
    inherits: ["user"],
  },
  // Sobreescribe roles predeterminados
})
```

### Flujo de Autenticación

```javascript
import {
  authenticateWithMetamask,
  executeWithPermission,
} from "gdb-p2p"

// Conectar con Metamask
const { userAddress } = await authenticateWithMetamask()

// Ejecutar operación protegida
await executeWithPermission(db, "delete", async () => {
  await db.remove("nodeIdToDelete")
})
```

### Asignar Roles

```javascript
import { assignRole } from "gdb-p2p"

// Asignar rol 'admin' con caducidad en 30 días
await assignRole(
  db,
  "0xUserAddress...",
  "admin",
  Date.now() + 30 * 24 * 60 * 60 * 1000
)
```

## API Reference

## Ejemplos de Uso

Puedes encontrar ejemplos prácticos de cómo usar esta biblioteca en la carpeta [examples](https://github.com/estebanrfp/gdb/tree/main/examples).

Algunos ejemplos incluyen:
- **Consulta básica**: Cómo realizar consultas simples.
- **Almacenamiento distribuido**: Cómo configurar una base de datos distribuida.

### **GraphDB**

| Método                     | Descripción                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `put(value, id)`           | Inserta o actualiza un nodo con el valor proporcionado. Si no se especifica `id`, se genera automáticamente. |
| `get(id)`                  | Obtiene un nodo por su ID. Retorna `null` si el nodo no existe.                                              |
| `find(value)`              | Busca nodos que coincidan con el valor proporcionado. Retorna el nodo más reciente encontrado.               |
| `link(sourceId, targetId)` | Crea una relación entre dos nodos identificados por `sourceId` y `targetId`.                                 |
| `map(callback)`            | Itera sobre todos los nodos en la base de datos. Ejecuta `callback` para cada nodo.                          |
| `remove(id)`               | Elimina un nodo por su ID. También elimina referencias a este nodo en otros nodos.                           |
| `update(id, newValue)`     | Actualiza el valor de un nodo existente.                                                                     |
| `clear()`                  | Elimina todos los nodos y relaciones de la base de datos.                                                    |

---

### **Roles**

#### Funciones Principales

| Función                                        | Descripción                                                                                              |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `setCustomRoles(customRoles)`                  | Define roles personalizados. Sobrescribe los roles predeterminados.                                      |
| `can(role, operation)`                         | Verifica si un rol tiene permiso para realizar una operación específica.                                 |
| `assignRole(db, userAddress, role, expiresAt)` | Asigna un rol a un usuario. Opcionalmente, permite establecer una fecha de caducidad.                    |
| `executeWithPermission(db, operation, action)` | Verifica si el usuario tiene permiso para realizar una operación y ejecuta la acción si está autorizado. |
| `authenticateWithMetamask()`                   | Autentica al usuario mediante Metamask y retorna su dirección y firma.                                   |

---

### **Eventos y Sincronización**

| Método/Fecha    | Descripción                                                                          |
| --------------- | ------------------------------------------------------------------------------------ |
| `on(callback)`  | Registra un listener para eventos personalizados (por ejemplo, cambios en el grafo). |
| `off(callback)` | Cancela el registro de un listener específico o todos los listeners.                 |
| `emit()`        | Emite un evento personalizado a todos los listeners registrados.                     |

---

### **Dependencias Internas**

| Dependencia        | Uso                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------- |
| `@msgpack/msgpack` | Serialización/deserialización de datos en formato MessagePack.                        |
| `pako`             | Compresión/descompresión de datos utilizando gzip.                                    |
| `trystero`         | Sincronización P2P para compartir cambios en tiempo real entre pestañas/dispositivos. |
| `BroadcastChannel` | Comunicación entre pestañas del navegador para notificar cambios locales.             |

---

### **Errores Comunes**

| Error                  | Descripción                                                         |
| ---------------------- | ------------------------------------------------------------------- |
| `RoleDoesNotExist`     | El rol especificado no existe en la configuración actual.           |
| `PermissionDenied`     | El usuario no tiene permisos para realizar la operación solicitada. |
| `NodeNotFound`         | El nodo con el ID especificado no existe en la base de datos.       |
| `MetamaskNotInstalled` | Metamask no está instalado o no está disponible en el navegador.    |
| `OperationFailed`      | La operación no pudo completarse debido a un error interno.         |

## Licencias

Este proyecto incluye dependencias de terceros con las siguientes licencias:

1. **@msgpack/msgpack**

   - Licencia: [BSD 3-Clause](https://opensource.org/licenses/BSD-3-Clause)
   - Fuente: [GitHub Repository](https://github.com/msgpack/msgpack-javascript)
   - Texto completo: [licenses/msgpack-license.txt](licenses/msgpack-license.txt)

2. **pako**

   - Licencia: [MIT License](https://opensource.org/licenses/MIT)
   - Fuente: [GitHub Repository](https://github.com/nodeca/pako)
   - Texto completo: [licenses/pako-license.txt](licenses/pako-license.txt)

3. **trystero**
   - Licencia: [MIT License](https://opensource.org/licenses/MIT)
   - Fuente: [GitHub Repository](https://github.com/trystero/trystero)
   - Texto completo: [licenses/trystero-license.txt](licenses/trystero-license.txt)

El código fuente de este proyecto está bajo la licencia [MIT](https://opensource.org/licenses/MIT). Para más detalles, consulta el archivo [LICENSE](LICENSE).

---

## Contribuir

Nos encantaría recibir tus contribuciones para mejorar este proyecto. Sigue estos pasos para colaborar:

1. **Fork del Repositorio**  
   Haz clic en el botón "Fork" en la esquina superior derecha de este repositorio para crear una copia en tu cuenta.

2. **Clonar el Repositorio**  
   Clona tu fork en tu máquina local:
   ```bash
   git clone https://github.com/estebanrfp/gdb.git
   cd gdb
   ```
3. **Crear una Nueva Rama**
   Crea una nueva rama para tu contribución:
   ```bash
   git checkout -b feature/AmazingFeature
   ```
4. **Realizar Cambios**
   Implementa tus cambios o correcciones. Asegúrate de seguir las guías de estilo y documentación del proyecto.
   ```

   ```
5. **Commit y Push**
   Confirma tus cambios y sube la rama al repositorio remoto:
   ```bash
    git add .
    git commit -m "Add AmazingFeature"
    git push origin feature/AmazingFeature
   ```
6. **Crear un Pull Request**
   Ve a la página de tu fork en GitHub y haz clic en "Compare & Pull Request". Describe tus cambios y envía el PR.

## Notas Adicionales

Asegúrate de que tus cambios pasen todas las pruebas antes de enviar un PR.
Si estás resolviendo un problema específico, menciona el número del issue relacionado en la descripción del PR.
Para grandes cambios, abre un issue primero para discutir lo que te gustaría implementar.
¡Gracias por contribuir! 🚀
