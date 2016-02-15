#include <stdint.h>
#include <stdio.h>
#include <assert.h>

void d3cpp_set_data(uint8_t const* data, int nbytes)
{
    printf("I can see a typed array with %d bytes.\n", nbytes);
}

void d3cpp_set_viewport(float const* data, int nbytes)
{
    assert(nbytes == 16);
    printf("%.2f %.2f %.2f %.2f\n", data[0], data[1], data[2], data[2]);
}
