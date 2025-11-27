"use client";

export function TurntableSpinner({ loading = true }: { loading?: boolean }) {
  return (
    <div className="w-12">
      {/* Square wrapper using padding trick */}
      <div className="relative w-full" style={{ paddingBottom: "100%" }}>
        <div className="absolute inset-0">
          {/* 1. The Spinning Record - sizing container */}
          <div
            style={{
              position: "absolute",
              top: "5%",
              left: "5%",
              width: "89%",
              paddingBottom: "89%",
            }}
          >
            {/* Record visual - explicitly positioned to fill parent */}
            <div
              className="rounded-full shadow-lg overflow-hidden"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: loading ? "#262626" : "#171717",
                animation: loading ? "spin 3s linear infinite" : "none",
                transition: "background-color 0.5s ease-out",
              }}
            >
              {/* Vinyl Sheen */}
              <div
                className="absolute inset-0 bg-[conic-gradient(from_45deg,transparent_0deg,white_70deg,transparent_140deg,white_250deg,transparent_360deg)]"
                style={{
                  opacity: loading ? 0.3 : 0.15,
                  transition: "opacity 0.5s ease-out",
                }}
              />

              {/* Vinyl Grooves */}
              <div
                className="absolute inset-0 rounded-full bg-[repeating-radial-gradient(circle,transparent_0,transparent_2px,#000_3px,#000_4px)]"
                style={{
                  opacity: loading ? 0.5 : 0.7,
                  transition: "opacity 0.5s ease-out",
                }}
              />

              {/* Record Label */}
              <div
                className="absolute inset-[32%] rounded-full border-4 border-neutral-900/40 shadow-inner flex items-center justify-center"
                style={{
                  backgroundColor: loading ? "#fb7185" : "#e11d48",
                  transition: "background-color 0.5s ease-out",
                }}
              >
                <div className="w-2 h-2 rounded-full bg-neutral-900/90 shadow-sm" />
              </div>
            </div>
          </div>

          {/* 2. The Tonearm */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              style={{
                position: "absolute",
                top: "-1%",
                right: "-1%",
                width: "18%",
                paddingBottom: "18%",
              }}
            >
              {/* Pivot Base */}
              <div
                className="rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] border z-20 flex items-center justify-center"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: loading ? "#d4d4d4" : "#e5e5e5",
                  borderColor: loading ? "#a3a3a3" : "#737373",
                  transition:
                    "background-color 0.5s ease-out, border-color 0.5s ease-out",
                }}
              >
                <div
                  className="w-[40%] h-[40%] rounded-full shadow-inner"
                  style={{
                    backgroundColor: loading ? "#a3a3a3" : "#737373",
                    transition: "background-color 0.5s ease-out",
                  }}
                />
              </div>

              {/* The Arm */}
              <div
                className="z-10"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "35%",
                  paddingBottom: "220%",
                  transformOrigin: "top center",
                  transform: `translate(-50%, 0) rotate(${loading ? "45deg" : "-30deg"})`,
                  transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <div
                  className="rounded-full"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: loading ? "#d4d4d4" : "#e5e5e5",
                    boxShadow: loading
                      ? "1px 1px 2px rgba(0,0,0,0.4)"
                      : "1px 1px 3px rgba(0,0,0,0.5)",
                    transition:
                      "background-color 0.5s ease-out, box-shadow 0.5s ease-out",
                  }}
                />

                {/* Headshell */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 rounded-sm border shadow-sm"
                  style={{
                    bottom: "-2%",
                    width: "200%",
                    height: "10%",
                    backgroundColor: loading ? "#d4d4d4" : "#e5e5e5",
                    borderColor: loading ? "#a3a3a3" : "#737373",
                    transition:
                      "background-color 0.5s ease-out, border-color 0.5s ease-out",
                  }}
                >
                  <div className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-[2px] h-[4px] bg-black/60" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

