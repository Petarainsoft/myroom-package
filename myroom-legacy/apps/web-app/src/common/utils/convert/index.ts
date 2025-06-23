

export const base64ToFile = (dataurl: string, fileName: string) => {

    const arr = dataurl.split(',');
    if (!arr) {
        return;
    }

    const mimeArr = arr[0].match(/:(.*?);/);
    if (!mimeArr) {
        return;
    }


    const mime = mimeArr[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], fileName, { type: mime });
}

// export const fileToBase64 = (file:File) : any => new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.readAsDataURL(file);
//     reader.onload = () => resolve(reader.result);
//     reader.onerror = reject;
// });
