# ⚠️ Source Code Not Included

This folder does **not** contain the original source code.  
Only **production build files**  are included in the `dist/` directory as part of the distribution process.

---

## 🔒 Why Is the Source Code Not Included?

1. **Client-Based Distributed Model**  
   GenosDB uses an architecture where the client acts as the source of truth.  
   To ensure integrity, consistency, and security, only the compiled and documented public API is exposed.

2. **Intentional Minification**  
   The distributed code is **minified**—automatically reduced and optimized (e.g., whitespace removed, variables renamed) to decrease size and improve performance.  
   No advanced obfuscation techniques have been applied.

3. **Production-Oriented Distribution**  
   This package is intended for direct use in production environments.
   Only the final build output is published, following common practices for libraries distributed via npm.

---

## ✅ How to Use This Module

Import directly from the package:

```js
import { gdb } from "genosdb";

const db = await gdb("my-db", { rtc: true });

```

## 📖 Learn More About Our Initiative

For a deeper understanding of why GenosDB's source code is not publicly available and our commitment to quality and sustainability, read our [PHILOSOPHY.md](https://github.com/estebanrfp/gdb/blob/main/PHILOSOPHY.md).