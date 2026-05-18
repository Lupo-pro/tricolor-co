# Testimonios — Selfies de clientas reales

Dropá acá los 4 selfies referenciados desde la sección `#testimonios`
en `index.html`. Hasta que los archivos existan, las cards muestran
un placeholder fanzine (cream + dashed border) sin romper el layout.

## Archivos esperados

| Archivo                          | Card | Cliente            |
|----------------------------------|------|--------------------|
| `selfie-cafe.jpg`                |  1   | María C. (Bogotá)  |
| `selfie-walking-cartagena.jpg`   |  2   | Valentina R. (Cartagena) |
| `selfie-bff.jpg`                 |  3   | Lucía & Sara (Pereira) |
| `selfie-event.jpg`               |  4   | Ana M. (Medellín)  |

## Especificaciones

- Formato: JPG (sRGB), 80–85% quality
- Resolución: mínimo **800×800px** (square crop centrado en la cara/torso)
- Peso: < 200 KB por imagen (correr `imagemin` o `squoosh` antes de commitear)
- Iluminación: natural, ambiente real (calle, café, evento) — no studio
- Encuadre: la prenda tricolor debe ser visible

## Disclaimer

Mientras las cards muestren clientas con quotes placeholder, la sección
incluye al pie el aviso:

> *Testimonios basados en feedback recibido de nuestras primeras clientas*

Cuando reemplaces los placeholders con selfies + quotes 100% reales y
con autorización escrita, borrá esa línea (`.testimonios-disclaimer`)
del HTML.
