import { useRef, useState } from "react"
import { LogOutIcon, VolumeOffIcon, Volume2Icon } from "lucide-react"
import { useAuthStore } from "../store/useAuthStore.js"
import { useChatStore } from "../store/useChatStore.js"

const mouseClickSound = new Audio("/sounds/mouse-click.mp3");

function ProfileHeader() {
    const { logout, authUser, updateProfilePic } = useAuthStore();
    const { isSoundEnabled, toggleSound } = useChatStore();
    const [ selectedImg, setSelectedImg ] = useState(null);

    const fileInputRef = useRef(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if(!file) return;

        const reader = new FileReader();  // javascript api
        reader.readAsDataURL(file);

        reader.onloadend = async () => {
            const base64Image = reader.result;
            setSelectedImg(base64Image);
            await updateProfilePic({ profilePic: base64Image });  // upload it to cloudinary via backend
        }
    };

    return (
        <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center justify-between">
                {/* Left side */}
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="avatar avatar-online">
                        <button className="size-14 rounded-full overflow-hidden relative group"
                            onClick={() => fileInputRef.current.click()}   // click the input indirectly when we click this button
                        >
                            <img 
                                src={selectedImg || authUser.profilePic || "/avatar.png" } 
                                alt="User image"
                                className="size-full object-cover"    
                            />
                            <div className="absolute cursor-pointer inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-white text-xs">Change</span>
                            </div>
                        </button>
                        <input 
                            type="file" 
                            accept="image/*" // anything which starts with "image/"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            className="hidden" />
                    </div>

                    {/*  Username & Online Text */}
                    <div>
                        <h3 className="text-slate-200 font-medium text-base max-w-[180px] truncate">
                            {authUser.fullName}
                        </h3>
                        <p className="text-slate-400 text-xs">Online</p>
                    </div>
                </div>

                {/* Right Side - Buttons */}
                <div className="flex gap-4 items-center">
                    {/* Logout button */}
                    <button 
                        className="text-slate-400 hover:text-slate-200 transition-colors"
                        onClick={logout}
                    >
                        <LogOutIcon className="size-5" />
                    </button>

                    {/* Sound Toggle Button */}
                    <button
                        className="text-slate-400 hover:text-slate-200 transition-colors"
                        onClick={() => {
                            // play click sound before toggling
                            mouseClickSound.currentTime = 0;    // reset to start
                            mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
                            toggleSound(); 
                        }}
                    >
                        {isSoundEnabled ? (
                            <Volume2Icon className="size-5" />
                        ): (
                            <VolumeOffIcon className="size-5" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ProfileHeader
