export class LRUMap<K, V> extends Map {
  private readonly hashmap = new Map<K, V>();

  constructor(private readonly capacity: number) {
    super();
  }

  public has(key: K): boolean {
    return this.hashmap.has(key);
  }

  public get(key: K): V | undefined {
    if(!this.hashmap.has(key)) return undefined;

    const val = this.hashmap.get(key);
    this.hashmap.delete(key);
    this.hashmap.set(key, val);

    return val;
  }

  public set(key: K, value: V) {
    this.hashmap.delete(key);

    if(this.hashmap.size === this.capacity) {
      this.hashmap.delete(this.hashmap.keys().next().value);
      console.log('--------------LRU CACHE: VALUE PRUNED--------------');
      this.hashmap.set(key, value);
    } else {
      this.hashmap.set(key, value);
    }

    return this;
  }

  public delete(key: K) {
    return this.hashmap.delete(key);
  }

  public get size(): number {
    return this.hashmap.size;
  }

  public clear() {
    return this.hashmap.clear();
  }
}
