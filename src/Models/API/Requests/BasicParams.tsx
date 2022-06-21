export interface IBasicParams {
    u: string; // Username
    t: string | undefined; // Token (md5(password+salt))
    s: string | undefined; // Salt
    v: string; // Api version targeted by client
    c: string; // Client identifier
    f: string; // Format expected (XML or Json)
    p: string | undefined; // Plaintext password
}