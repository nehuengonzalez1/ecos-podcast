# Imágenes del sitio

Archivos que se sirven tal cual desde la raíz. Lo que se guarde acá queda
disponible en `/imagenes/<nombre>`.

## Archivos que el sitio espera

| Archivo | Dónde se usa | Si falta |
|---|---|---|
| `carta.jpg` | La foto de "La carta" en todos los episodios | Se dibuja un respaldo; no se rompe nada |
| `regalo.jpg` | La foto de "El regalo del episodio" | Ídem |

## Cómo reemplazar una por episodio

Las dos son fotos de marca y sirven para todos los episodios. Si algún
episodio tiene la suya, se carga en `data/episodes.json`:

```json
{
  "slug": "santi-morales",
  "carta": { "imagen": "/imagenes/carta-santi-morales.jpg" }
}
```

Lo mismo para el regalo del episodio, que no tiene imagen por defecto porque
es distinto en cada uno:

```json
{
  "regalo": {
    "imagen": "/imagenes/regalo-santi-morales.jpg",
    "nota": "A Santi le regalamos una carta escrita por el Santi de 8 años."
  }
}
```

## Recomendaciones

- **La carta**: apaisada, cerca de 16:11. La del diseño es 1536×1024.
- **El regalo**: se recorta cuadrado, asi que conviene el sujeto centrado.
- Guardar en JPG con calidad alta. Estas fotos son oscuras y con grano: en PNG
  pesan varias veces más sin verse mejor.
