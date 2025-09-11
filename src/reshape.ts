export function reshape<T>(flat: ArrayLike<T>, shape: number[], fortranOrder = false): any {
    // Return the single element if shape is empty
    if (!shape.length) return flat[0];

    // Check if the total number of elements matches
    const totalSize = shape.reduce((a, b) => a * b, 1);
    if (flat.length !== totalSize) {
        throw new Error(`Cannot reshape array of size ${flat.length} into shape (${shape.join(', ')})`);
    }

    // Strides determine how many indices to jump in the flat array
    // when we move one step along a given dimension.
    const strides: number[] = new Array(shape.length);
    let stride = 1;

    if (fortranOrder) {
        // Fortran-order (column-major): First index changes fastest
        for (let i = 0; i < shape.length; i++) {
            strides[i] = stride;
            stride *= shape[i];
        }
    } else {
        // C-order (row-major): Last index changes fastest
        for (let i = shape.length - 1; i >= 0; i--) {
            strides[i] = stride;
            stride *= shape[i];
        }
    }

    // Recursive function to build the nested array
    function build(dims: number[], currentCoords: number[]): any {
        const [currentDim, ...remainingDims] = dims;

        if (!remainingDims.length) {
            return Array.from({ length: currentDim }, (_, i) => {
                const finalCoords = [...currentCoords, i];
                // Calculate the index in the flat array
                let flatIndex = 0;
                for (let d = 0; d < finalCoords.length; d++) {
                    flatIndex += finalCoords[d] * strides[d];
                }
                return flat[flatIndex];
            });
        }

        return Array.from({ length: currentDim }, (_, i) =>
            build(remainingDims, [...currentCoords, i])
        );
    }

    return build(shape, []);
}