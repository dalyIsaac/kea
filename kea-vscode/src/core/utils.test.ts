import * as assert from "assert";
import { trimLength } from "./utils";

suite("Utils", () => {
  suite("trimLength", () => {
    test("should return string unchanged when shorter than max length", () => {
      // Given
      const input = "Hello world";
      const maxLength = 20;

      // When
      const result = trimLength(input, maxLength);

      // Then
      assert.strictEqual(result, input, "Input string should remain unchanged");
    });

    test("should return string unchanged when equal to max length", () => {
      // Given
      const input = "Hello world";
      const maxLength = 11;

      // When
      const result = trimLength(input, maxLength);

      // Then
      assert.strictEqual(result, input, "Input string should remain unchanged");
    });

    test("should trim string and add ellipsis when longer than max length", () => {
      // Given
      const input = "This is a long string that needs trimming";
      const maxLength = 10;

      // When
      const result = trimLength(input, maxLength);

      // Then
      assert.strictEqual(result, "This is a ...", "String should be trimmed to 10 characters plus ellipsis");
    });

    test("should handle empty string", () => {
      // Given
      const input = "";
      const maxLength = 10;

      // When
      const result = trimLength(input, maxLength);

      // Then
      assert.strictEqual(result, "", "Empty string should remain empty");
    });

    test("should handle very short max length", () => {
      // Given
      const input = "Hello";
      const maxLength = 1;

      // When
      const result = trimLength(input, maxLength);

      // Then
      assert.strictEqual(result, "H...", "String should be trimmed to 1 character plus ellipsis");
    });

    test("should handle zero max length", () => {
      // Given
      const input = "Hello";
      const maxLength = 0;

      // When
      const result = trimLength(input, maxLength);

      // Then
      assert.strictEqual(result, "...", "String should be just ellipsis when max length is zero");
    });

    test("should handle negative max length", () => {
      // Given
      const input = "Hello";
      const maxLength = -5;

      // When
      const result = trimLength(input, maxLength);

      // Then
      assert.strictEqual(result, "...", "String should be just ellipsis when max length is negative");
    });
  });
});
