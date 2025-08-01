# ⚠️ Código fuente no incluido

Esta carpeta no contiene el código fuente original.  
Solo se incluyen archivos **minificados** en el directorio `dist/`, como parte del proceso de distribución.

---

## 🔒 ¿Por qué no se incluye el código fuente?

1. **Modelo distribuido basado en cliente**  
   GenosDB implementa una arquitectura donde el cliente actúa como fuente de verdad.  
   Por razones de integridad, coherencia y seguridad, solo se expone la API pública compilada y documentada.

2. **Minificación intencional**  
   El código distribuido ha sido **minificado**, es decir, reducido y optimizado automáticamente (eliminando espacios, renombrando variables, etc.) para disminuir su tamaño y mejorar el rendimiento.  
   No se ha aplicado ningún proceso de ofuscación avanzada.

3. **Distribución orientada a producción**  
   Este paquete está diseñado para ser consumido directamente en producción.  
   Solo se publica el resultado final del proceso de build, lo cual es una práctica común en bibliotecas distribuidas por npm.

   > Ejemplo: muchas librerías modernas publican únicamente bundles minificados en su salida final.

4. **Compatibilidad total con herramientas modernas**  
   La API pública está completamente documentada y disponible a través de los nuestra wiki
   Esto permite que editores de código, entornos de desarrollo y usuarios finales puedan utilizar el paquete sin necesidad del código fuente.

---

## ✅ Cómo utilizar este módulo

Importa directamente desde el paquete:

```js
import { GDB } from "genosdb";
const db = new GDB("myDatabase");