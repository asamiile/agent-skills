# Batching layered 2D shapes into one WebGL 2 draw

## When it applies

A design built from many filled shapes, each repeated as many interpolated layers (an extrusion, a blend between a front and a back copy, motion trails). In Canvas 2D that is `shapes × layers` fills per frame. Tens of thousands of fills can run fine on one machine and produce frames of several hundred milliseconds on another.

## Layout of the data

| Piece | Form | Updated |
| --- | --- | --- |
| Quad corners | Vertex buffer of `(0,0) (1,0) (0,1) (1,1)` plus a shape index per vertex; index buffer with 6 indices per shape | Once |
| Per-shape constants: front and back centers, bounds, mask rectangle in the atlas, color, back scale | `RGBA32F` texture, one column per shape, one row per group of values (`texStorage2D`) | Once |
| Per-shape animated values: progress, opacity, offsets | One more row of the same texture | Each frame (`texSubImage2D` of that row only) |
| Shape outlines | Mask atlas: every shape filled white with Canvas 2D, packed in rows, uploaded as `R8` | Once (and on resize) |

Values that apply to all shapes (layer count, canvas size, scale, colors) are uniforms.

## The draw

- `gl_InstanceID` is the layer index. The vertex shader turns it into an interpolation factor `u` (0 = back, 1 = front), then mixes position, scale, and color between the back and front values
- Order instances from the back layer to the front layer. Within one instanced draw, instances are rasterized in order, so blending matches the painting order of the Canvas 2D loop
- Discard a vertex by moving it outside clip space (`gl_Position = vec4(2.0, 2.0, 2.0, 1.0)`) for layers a shape has not reached yet
- The fragment shader multiplies the mask value by the color's alpha and outputs premultiplied color; blend with `blendFunc(ONE, ONE_MINUS_SRC_ALPHA)` and create the context with `premultipliedAlpha: true`
- Turn off `antialias`; the mask's mipmaps already give smooth edges

## The mask atlas

- Measure each shape's bounding box, scale it to the target resolution, and pack the boxes in rows within `MAX_TEXTURE_SIZE`. If the atlas does not fit, lower the scale and try again
- Leave a few pixels of padding around each shape so mipmaps do not bleed between neighbors
- Upload with `UNPACK_PREMULTIPLY_ALPHA_WEBGL = true` and format `R8` / `RED`: a white shape on a transparent canvas then lands in the red channel as coverage. One channel uses a quarter of the memory of RGBA
- Generate mipmaps and use `LINEAR_MIPMAP_LINEAR`, because shapes are drawn scaled down for back layers
- Release the 2D canvas afterwards (`canvas.width = 0`)

## Results to expect

On the devices where Canvas 2D stuttered, the single instanced draw removed the very long frames, and on fast machines the per-frame draw time dropped to a fraction. The look of the final frame was indistinguishable from Canvas 2D. Verify the same in each project with screenshot comparison.
