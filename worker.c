#define PAR_SPRUNE_IMPLEMENTATION
#include "par/par_sprune.h"

#include <emscripten.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <assert.h>

struct {
    float* original_boxes;
    float* transformed_boxes;
    int nboxes;
    par_sprune_context* context;
    float viewport[4];
    float winsize[2];
} app = {0};

void d3cpp_set_winsize(float const* data, int nbytes)
{
    assert(nbytes == 8);
    app.viewport[2] = app.winsize[0] = data[0];
    app.viewport[3] = app.winsize[1] = data[1];
}

void d3cpp_set_data(uint8_t const* data, int nbytes)
{
    if (app.original_boxes == 0) {
        app.original_boxes = malloc(nbytes);
        app.nboxes = nbytes / 16;
    }
    assert(app.nboxes == nbytes / 16);
    memcpy(app.original_boxes, data, nbytes);
}

static void d3cpp_execute()
{
    if (app.transformed_boxes == 0) {
        app.transformed_boxes = malloc(app.nboxes * 16);
    }

    float sx = app.winsize[0] / (app.viewport[2] - app.viewport[0]);
    float sy = app.winsize[1] / (app.viewport[3] - app.viewport[1]);

    float const* src = (float const*) app.original_boxes;
    float* dst = (float*) app.transformed_boxes;
    for (int i = 0; i < app.nboxes * 4;) {
        float x0 = *src++;
        float y0 = *src++;
        float x1 = *src++;
        float y1 = *src++;
        float cx = sx * 0.5 * (x0 + x1);
        float cy = sy * 0.5 * (y0 + y1);
        float w = 0.5 * (x1 - x0);
        float h = 0.5 * (y1 - y0);
        dst[i++] = cx - w;
        dst[i++] = cy - h;
        dst[i++] = cx + w;
        dst[i++] = cy + h;
    }

    if (!app.context) {
        app.context = par_sprune_overlap(dst, app.nboxes, app.context);
    } else {
        par_sprune_update(app.context);
    }
    par_sprune_cull(app.context);

    uint8_t const* collisions = (uint8_t const*) app.context->collision_pairs;
    int ncollisions = app.context->ncollision_pairs;
    uint8_t const* culled = (uint8_t const*) app.context->culled;
    int nculled = app.context->nculled;

    EM_ASM_INT({
        postMessage({
            collisions: new Uint8Array(HEAPU8.subarray($0, $1)),
            culled: new Uint8Array(HEAPU8.subarray($2, $3)),
        });
    }, collisions, collisions + ncollisions * 8, culled, culled + nculled * 4);
}

void d3cpp_set_viewport(float const* data, int nbytes)
{
    assert(nbytes == 16);
    app.viewport[0] = data[0];
    app.viewport[1] = data[1];
    app.viewport[2] = data[2];
    app.viewport[3] = data[3];
    #ifdef VERBOSE
    printf("%.2f %.2f %.2f %.2f\n", data[0], data[1], data[2], data[2]);
    #endif
    d3cpp_execute();
}
