import { join } from 'path'
import { app } from 'electron'

export const SQL_DIR = join(app.getAppPath(), 'db')
export const MIGRATIONS_DIR = join(SQL_DIR, 'migrations')
export const VIEWS_DIR = join(SQL_DIR, 'views')
export const QUERIES_DIR = join(SQL_DIR, 'queries')
