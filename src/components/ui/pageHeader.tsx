import { cn } from "@/lib/utils"

function PageHeader({
                        className,
                        children,
                        ...props
                    }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <section
            className={cn(
            "mx-auto flex max-w-5xl flex-col items-center gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20",
            className
    )}
    {...props}
>
    {children}
    </section>
)
}

function PageHeaderHeading({
                               className,
                               ...props
                           }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h1
            className={cn(
            "text-center text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl",
            className
    )}
    {...props}
    />
)
}

function PageHeaderDescription({
                                   className,
                                   ...props
                               }: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <div
            className={cn("text-center text-lg text-muted-foreground", className)}
    {...props}
    />
)
}

export { PageHeader, PageHeaderHeading, PageHeaderDescription }