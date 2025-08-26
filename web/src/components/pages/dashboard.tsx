import LiquidChrome from "../liquid-chrome";
import { ProjectsList } from "../projects-list";
import { Uploader } from "../uploader";

export default function Dashboard() {
    return (
        <div className="w-full h-full p-8 flex flex-col gap-4 items-center justify-center">
          <h1 className="font-ibm-serif text-4xl font-medium italic tracking-tight text-foreground/90">Start Generating Clips</h1>
            <div className="relative w-full max-w-md  rounded-2xl overflow-hidden">
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <LiquidChrome className="w-full h-full" />
                </div>

                <div className="relative z-10">
                    <Uploader />
                </div>
            </div>
        </div>
    );
}
