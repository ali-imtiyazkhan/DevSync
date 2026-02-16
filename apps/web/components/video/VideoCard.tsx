export default function VideoCard({
    title,
    videoRef,
    muted,
}: {
    title: string;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    muted?: boolean;
}) {
    return (
        <div className="bg-slate-800 p-3 rounded-xl">
            <h3 className="mb-2 text-sm">{title}</h3>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={muted}
                className="w-full rounded-lg"
            />
        </div>
    );
}
