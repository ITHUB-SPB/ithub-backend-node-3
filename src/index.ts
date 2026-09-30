import express from 'express'
import * as z from "zod"
import { ru } from "zod/locales"

z.config(ru())

const app = express()

// подключение раздачи статики по виртуальному пути /static из директории /assets

// встроенные глобальные миддлвэа на парсинг тел в json и x-www-form-urlencoded
// TODO
// TODO

// самописный миддлвэа на логгирование
// TODO

// подключение роутера продуктов
// TODO

// подключение обработчика not-found запросов
// TODO

// подключение глобального error-миддлвэа
// TODO

app.listen(3000)