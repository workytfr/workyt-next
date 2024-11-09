declare module 'react-katex' {
    import * as React from 'react';

    interface KatexProps {
        children?: string;
        math: string;
        errorColor?: string;
        renderError?: (error: Error) => React.ReactNode;
    }

    export const InlineMath: React.FC<KatexProps>;
    export const BlockMath: React.FC<KatexProps>;
}
