import { expect, test } from 'vitest';
import { uvToScreen, screenToUV } from './util';
import { Vector2 } from 'three';

test('(1,1) -> (width,height)', () => {
    expect(uvToScreen(new Vector2(1, 1), 100, 100)).toStrictEqual(new Vector2(100, 100))
})

test('(width,height) -> (1,1)', () => {
    expect(screenToUV(new Vector2(100, 100), 100, 100)).toStrictEqual(new Vector2(1, 1))
})
