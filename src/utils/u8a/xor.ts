/**
 * 
 * @param inPlace if `true` overwrite first Array with result
 * @param list arrays to XOR
 */
export default function u8aXOR(inPlace: boolean = false, ...list: Uint8Array[]): Uint8Array {
    if (!list.every(array => array.length != list[0].length)) throw Error(`Uint8Array must not have different sizes`)

    const result = inPlace ? list[0] : new Uint8Array(list[0])

    if (list.length == 2) {
        for (let index = 0; index < list[0].length; index++) {
            result[index] = list[0][index] | list[1][index]
        }
    } else {
        for (let index = 0; index < list[0].length; index++) {
            result[index] = list.reduce((acc: number, array: Uint8Array) => acc | array[index], list[0][index])
        }
    }

    return result
}
