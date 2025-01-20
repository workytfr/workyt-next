declare module 'backblaze-b2' {
    export default class B2 {
        constructor(options: { applicationKeyId: string; applicationKey: string });
        authorize(): Promise<void>;
        getUploadUrl(options: { bucketId: string }): Promise<any>;
        uploadFile(options: {
            uploadUrl: string;
            uploadAuthToken: string;
            fileName: string;
            data: NodeJS.ReadableStream | Buffer | Blob;
            contentType: string;
        }): Promise<any>;
    }
}
