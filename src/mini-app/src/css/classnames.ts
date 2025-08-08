export type MergeClassNames<Tuple extends any[]> =
// Removes all types from union that will be ignored by the mergeClassNames function.
  Exclude<Tuple[number], any[] | boolean | null | number | string | undefined> extends infer Union
    ?
    & Partial<Record<UnionOptionalKeys<Union>, string>>
    & Record<UnionRequiredKeys<Union>, string>
    : never;

type UnionOptionalKeys<U> = Exclude<UnionStringKeys<U>, UnionRequiredKeys<U>>;

type UnionRequiredKeys<U> = U extends U
  ? { [K in UnionStringKeys<U>]: (object extends Pick<U, K> ? never : K) }[UnionStringKeys<U>]
  : never;

type UnionStringKeys<U> = U extends U
  ? { [K in keyof U]-?: U[K] extends string | undefined ? K : never }[keyof U]
  : never;

/**
 * Function which joins passed values with space following these rules:
 * 1. If value is non-empty string, it will be added to output.
 * 2. If value is object, only those keys will be added, which values are truthy.
 * 3. If value is array, classNames will be called with this value spread.
 * 4. All other values are ignored.
 *
 * You can find this function to similar one from the package {@link https://www.npmjs.com/package/classnames|classnames}.
 * @param values - values array.
 * @returns Final class name.
 */
export function classNames(...values: any[]): string {
  return values
    .map((value) => {
      if (typeof value === 'string') {
        return value;
      }

      if (isRecord(value)) {
        return classNames(Object.entries(value).map((entry) => entry[1] && entry[0]));
      }

      if (Array.isArray(value)) {
        return classNames(...value);
      }
    })
    .filter(Boolean)
    .join(' ');
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Merges two sets of classnames.
 *
 * The function expects to pass an array of objects with values that could be passed to
 * the `classNames` function.
 * @returns An object with keys from all objects with merged values.
 * @see classNames
 */
export function mergeClassNames<T extends any[]>(...partials: T): MergeClassNames<T> {
  return partials.reduce<MergeClassNames<T>>((acc, partial) => {
    if (isRecord(partial)) {
      Object.entries(partial).forEach(([key, value]) => {
        const className = classNames((acc as any)[key], value);
        if (className) {
          (acc as any)[key] = className;
        }
      });
    }
    return acc;
  }, {} as MergeClassNames<T>);
}