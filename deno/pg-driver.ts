export {
  CompiledQuery,
  type DatabaseConnection,
  type Driver,
  type QueryResult,
  type TransactionSettings,
} from 'https://esm.sh/kysely@0.21.4'

export {
  Client
} from 'https://deno.land/x/postgres@v0.16.1/mod.ts'

type QueryArguments = unknown[] | Record<string, unknown>

export class PostgresDriver implements Driver {
  readonly #connectionMutex = new ConnectionMutex()

  #client?: Client
  #connection?: DatabaseConnection

  db_conn_info: string

  constructor(conn_info: string) {
    this.db_conn_info = conn_info
  }

  init(): Promise<void> {
    this.#client = new Client(this.db_conn_info)
    this.#connection = new PgConnection(this.#client)
    return Promise.resolve()
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    await this.#connectionMutex.lock()
    return this.#connection!
  }

  async beginTransaction(
    connection: DatabaseConnection,
    _settings: TransactionSettings
  ): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('begin'))
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('commit'))
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('rollback'))
  }

  releaseConnection(): Promise<void> {
    this.#connectionMutex.unlock()
    return Promise.resolve()
  }

  destroy(): Promise<void> {
    this.#client?.end()
    return Promise.resolve()
  }
}

class PgConnection implements DatabaseConnection {
  readonly #db: Client

  constructor(c: Client) {
    this.#db = c
  }

  streamQuery<R>(
    _compiledQuery: CompiledQuery,
    _chunkSize?: number | undefined
  ): AsyncIterableIterator<QueryResult<R>> {
    throw new Error('Method not implemented.')
  }

  async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    const { sql, parameters } = compiledQuery

    const { rows } = await this.#db.queryObject(
      sql,
      parameters as QueryArguments
    )

    return Promise.resolve({
      rows: rows as [],
    })
  }
}

class ConnectionMutex {
  #promise?: Promise<void>
  #resolve?: () => void

  async lock(): Promise<void> {
    while (this.#promise) {
      await this.#promise
    }

    this.#promise = new Promise((resolve) => {
      this.#resolve = resolve
    })
  }

  unlock(): void {
    const resolve = this.#resolve

    this.#promise = undefined
    this.#resolve = undefined

    resolve?.()
  }
}
