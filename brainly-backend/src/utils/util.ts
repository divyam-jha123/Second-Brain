

export const generateRandom = (len: number = 10) => {
    let options = "estrdtfygkhjlkdohnouqjlco345768798gibxib908uh";
    let ans = "";

    for (let i = 0; i < len; i++) {
        ans += options[Math.floor(Math.random() * options.length)];
    }

    return ans;
}