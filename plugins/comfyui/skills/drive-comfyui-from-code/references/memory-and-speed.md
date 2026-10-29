# Memory and speed on limited hardware

Lessons from running SDXL-class checkpoints on CPU in Docker. Re-measure on your hardware.

## Out-of-memory crashes

- **Loading the checkpoint** can already exceed Docker Desktop's default memory. Raise the allocation before debugging anything else
- **VAE encode/decode of large images** is a peak-memory spike. Use the tiled VAE nodes (tile size and overlap configurable); memory then stays bounded whatever the image size
- **AI upscale models at their native factor** (for example 4x) create a huge intermediate image (1024 → 4096) whose forward pass can exhaust memory even with a large allocation. Resize directly to the target size and refine with an image-to-image pass at partial denoise instead

## Speed

- Diffusion cost grows faster than the number of pixels (attention). One CPU measurement: 1024² took about 7 minutes, 2048² about 75 minutes. A literal 4K output on CPU is hours per image
- Total pixel count, not aspect ratio, drives the time: 1280x720 costs about the same as 1024x1024
- Few-step distilled checkpoints cut the time per image most; make sure the sampler settings match the checkpoint's model card, or the result looks undertrained

## Startup

Some builds try to initialize CUDA and crash without a GPU instead of falling back. Start ComfyUI with its CPU flag in images meant for machines without GPU passthrough, and drop the flag where a GPU is passed in.
