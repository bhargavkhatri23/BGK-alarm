interface DeviceFrameWrapperProps {
  children: React.ReactNode;
}

export const DeviceFrameWrapper: React.FC<DeviceFrameWrapperProps> = ({
  children,
}) => {
  return (
    <div className="min-h-screen bg-[#05080F] flex flex-col items-center justify-start text-slate-100">
      {/* Top Universal App Control Bar - Omnitrix Tech Styling */}

      {/* Content Area */}
      <div className="w-full flex-1 flex flex-col bg-[#070B12]">
        {children}
      </div>
    </div>
  );
};
