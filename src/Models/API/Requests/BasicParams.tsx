export interface IBasicParams {
    u: string; // Username
    t: string; // Token (md5(password+salt))
    s: string; // Salt
    v: string; // Api version targeted by client
    c: string; // Client identifier
    f: string; // Format expected (XML or Json)
}