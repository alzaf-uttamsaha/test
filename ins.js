'use client';
import { BrandLogo } from "@/assets/icons";
import InstallLoader from "@/assets/loader.gif";
import Image from "next/image";
import { useEffect, useState } from "react";

const InstallingServers = ({ installingData, refetch }) => {
  const staticLocalStorageKey = 'static_install_value';

  const initializeCountdowns = () => {
    const storedCountdowns = {};
    installingData?.forEach((site) => {
      const storedTime = localStorage.getItem(`install_${site.id}`);
      storedCountdowns[site.id] = storedTime ? parseInt(storedTime) : 599;
    });
    return storedCountdowns;
  };

  const [countdowns, setCountdowns] = useState(initializeCountdowns());

  const updateCountdown = (siteId, newTime) => {
    setCountdowns((prevCountdowns) => ({
      ...prevCountdowns,
      [siteId]: newTime,
    }));
    localStorage.setItem(`install_${siteId}`, newTime);
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  };

  useEffect(() => {
    // Set the static value in localStorage if it's not already set
    const currentStaticValue = localStorage.getItem(staticLocalStorageKey);
    if (!currentStaticValue) {
      localStorage.setItem(staticLocalStorageKey, JSON.stringify(installingData));
    } else {
      // If the static value exists, compare it with the current installingData
      const previousStaticValue = JSON.parse(currentStaticValue);
      if (JSON.stringify(previousStaticValue) !== JSON.stringify(installingData)) {
        localStorage.setItem(staticLocalStorageKey, JSON.stringify(installingData));
      }
    }
  }, [installingData]);

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdowns((prevCountdowns) => {
        const updatedCountdowns = { ...prevCountdowns };
        Object.keys(updatedCountdowns).forEach((siteId) => {
          if (updatedCountdowns[siteId] > 0) {
            const newTime = updatedCountdowns[siteId] - 1;
            updateCountdown(siteId, newTime);
          } else {
            // Clear localStorage when countdown reaches zero
            localStorage.removeItem(`install_${siteId}`);
          }
        });
        return updatedCountdowns;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);


  useEffect(() => {
    installingData?.forEach((site) => {
      const timeLeft = site?.time_left;
      if (timeLeft !== undefined) {
        const minutes = Math.floor(timeLeft);
        const seconds = Math.floor((timeLeft % 1) * 60);
        const totalSeconds = minutes * 60 + seconds;

        // Check localStorage static value against the API value
        const currentStaticValue = JSON.parse(localStorage.getItem(staticLocalStorageKey));
        if (currentStaticValue) {
          const apiValue = installingData.find(data => data.id === site.id);
          if (apiValue && apiValue.time_left !== undefined) {
            const apiTotalSeconds = Math.floor(apiValue.time_left) * 60 + Math.floor((apiValue.time_left % 1) * 60);
            if (apiTotalSeconds !== totalSeconds) {
              updateCountdown(site.id, totalSeconds);
            }
          }
        }
      }
    });
  }, [installingData]);

  const [allInstallingSite, setAllInstallingSite] = useState(
    installingData.length > 0 && installingData.length > 3
      ? installingData.slice(0, 3)
      : installingData
  );
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (showAll) {
      setAllInstallingSite(installingData);
    } else {
      setAllInstallingSite(
        installingData.length > 0 && installingData.length > 3
          ? installingData.slice(0, 3)
          : installingData
      );
    }
  }, [showAll, installingData]);

  return (
    <>
      {allInstallingSite?.map((installingSite, index) => (
        <div
          key={index}
          className="flex items-center bg-white py-2 md:py-[15px] px-5 my-[10px] rounded"
        >
          <div className="flex flex-col gap-5 lg:flex-row justify-start lg:items-center">
            <div className="gap-1 flex md:gap-3 justify-start items-center">
              <span className="brand-logoPhn"><BrandLogo /></span>
              <h4 className="text-xs whitespace-nowrap md:text-lg font-medium text-ribonBlue">
                {installingSite.name?.length > 15
                  ? `${installingSite?.name?.slice(0, 15)}...`
                  : installingSite?.name}
              </h4>
            </div>
            <div>
              <h4 className="text-[8px] leading-[18px] md:text-xs text-grey400 whitespace-nowrap">
                Created: {installingSite?.created_at || "Not available"}
              </h4>
            </div>
          </div>
          <div className="flex flex-col items-end lg:flex-row lg:items-center lg:gap-7 w-full lg:justify-end">
            <div className="flex items-center justify-center">
              <span className="text-[8px] md:text-[14px] font-medium text-secondary ">
                Installing Server...{" "}
                <span className="text-[8px] md:text-xs text-ribbonBlue600 font-semibold w-fit">
                  approximately {formatTime(countdowns[installingSite.id])}
                </span>
              </span>
            </div>

            <div>
              <div className="flex items-center select-none justify-end">
                <Image
                  className="w-[30px] h-[20px] md:w-[60px] md:h-[41px]"
                  src={InstallLoader}
                  alt="Installing..."
                  width={60}
                  height={60}
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      {installingData.length > 3 && (
        <div className="mt-2 mb-4 flex items-center justify-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="bg-ribonBlue hover:bg-hoverRibonBlue text-white font-medium duration-100 rounded-[4px] leading-[28px] px-[7px] text-[14px] border-none outline-none hover:extraDarkBlue"
          >
            {showAll ? "Show less" : "Show more"}
          </button>
        </div>
      )}
    </>
  );
};

export default InstallingServers;
