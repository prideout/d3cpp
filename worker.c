#define PAR_SPRUNE_IMPLEMENTATION
#include "par/par_sprune.h"

#include <emscripten.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <assert.h>

struct {
    float* boxes;
    int nboxes;
    par_sprune_context* context;
} app = {0};

void d3cpp_set_data(uint8_t const* data, int nbytes)
{
    if (app.boxes == 0) {
        app.boxes = malloc(nbytes);
        app.nboxes = nbytes / 16;
    }
    assert(app.nboxes == nbytes / 16);
    memcpy(app.boxes, data, nbytes);

    #ifdef VERBOSE
    float const* boxes = app.boxes;
    for (int i = 0; i < app.nboxes; i++) {
        float x0 = *boxes++;
        float y0 = *boxes++;
        float x1 = *boxes++;
        float y1 = *boxes++;
        printf("%f %f %f %f\n",
            x0, y0, x1, y1);
    }
    #endif

    app.context = par_sprune_overlap(app.boxes, app.nboxes, app.context);
    uint8_t const* collisions = (uint8_t const*) app.context->collision_pairs;
    int ncollisions = app.context->ncollision_pairs;

    EM_ASM_INT({
        postMessage({
            collisions: new Uint8Array(HEAPU8.subarray($0, $1))
        });
    }, collisions, collisions + ncollisions * 8);
}

void d3cpp_set_viewport(float const* data, int nbytes)
{
    assert(nbytes == 16);
    #ifdef VERBOSE
    printf("%.2f %.2f %.2f %.2f\n", data[0], data[1], data[2], data[2]);
    #endif
}
