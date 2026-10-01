declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DEBUG: boolean
        }
    }
}

export { }