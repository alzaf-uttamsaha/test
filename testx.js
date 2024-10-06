//dashboard
'use client'
import EmptyServerContent from '../dashboard/components/empty-server'
import HasServer from '../dashboard/components/has-server'
import InstallingServers from "@/app/dashboard/components/InstallingServers";
import endpoint from "@/utils/endpoint";
import { GridIcon, MenuIcon, SearchIcon, } from "@/assets/icons";
import { useEffect, useRef, useState } from "react";
import ServersListDropdown from "@/components/Shared/ServersListDropdown";
import CreateServerBtn from "@/utils/CreateServerBtn";
import axios from "axios";
import { getCookie } from "@/utils/cookieUtils";
import DashboardSkeleton from '@/utils/Skeleton/DashboardSkeleton/DashboardSkeleton';
import TableBoxSkeleton from '@/utils/Skeleton/Table/SingleRowSkeleton';
import { useGetAllInstallingServerListQuery } from "@/redux/query/PrivateQuery";
import UserLayout from '@/components/layout/UserLayout';

export default function Dashboard() {
    const [serverList, setServerList] = useState(
        typeof window !== "undefined" &&
            JSON.parse(typeof window !== "undefined" ? window.localStorage.getItem('all_server_list') : false)
            ? JSON.parse(typeof window !== "undefined" ? window.localStorage.getItem('all_server_list') : false)
            : {}
    );
    const searchIconRef = useRef(null);
    const [isLoading, setIsloading] = useState(false);
    const [shouldRefetch, setShouldRefetch] = useState(false);
    const [isInstallingLoading, setIsInsallingLoading] = useState(true);
    const [loadingCount, setLoadingCount] = useState(0);

    const { isLoading: isInstalling, data: installingData, refetch: installingRefetch } = useGetAllInstallingServerListQuery();
    const [serverViewLayout, setServerViewLayout] = useState('grid');

    const handleServerViewListLayout = () => {
        setServerViewLayout("list");
        localStorage.setItem("serverLayout", "list");
    }

    const handleServerViewGridLayout = () => {
        setServerViewLayout("grid");
        localStorage.setItem("serverLayout", "grid");
    }

    useEffect(() => {
        let layout = typeof window !== "undefined" ? window.localStorage.getItem('serverLayout') : false;
        if (layout === null) {
            localStorage.setItem("serverLayout", "grid");
            setServerViewLayout('grid');
        } else {
            setServerViewLayout(layout);
        }

    }, [serverViewLayout])

    function handleSearchBtn() {
        searchIconRef.current.focus();
    }

    // get all server list
    const handleGetServerList = async (id) => {
        const apiUrl = `${process.env.NEXT_PUBLIC_CLOUD_URL}${endpoint.dashboard.get_server_list}`;
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getCookie("auth_token")}`,
        };

        try {
            const response = await axios.get(apiUrl, { headers });

            const installingStatusExists = response?.data?.data?.some(obj => obj.status === 'installing');
            if (response?.status === 200) {
                setServerList(response?.data);
                localStorage.setItem('all_server_list', JSON.stringify(response?.data))
            }
            if (installingStatusExists) {
                const timeoutId = setTimeout(() => {
                    if (installingData && installingRefetch) {
                        installingRefetch();

                        // console.log('test res', response)
                    }
                    setShouldRefetch(!shouldRefetch);
                }, 30000);
                return () => clearTimeout(timeoutId);
            } else {
                setServerList(response?.data);
                setIsInsallingLoading(false);
                localStorage.setItem('all_server_list', JSON.stringify(response?.data))
                if (installingData && installingRefetch) {
                    installingRefetch();
                }
            }

        } catch (error) {
            // console.log(error);
        }
    };

    useEffect(() => {
        handleGetServerList();
        if (loadingCount === 0) {
            setLoadingCount(loadingCount + 1);
        }
    }, [shouldRefetch])

    useEffect(() => {
        installingRefetch();
    }, [])
//TODO: server installing data exist in serverList, and installing data
    return (
        <UserLayout>
            <div className="pl-3 pr-3 md:pr-3 xl:pr-0 md:pl-0 w-full main-body">
                <div className="flex items-center justify-start md:mb-[16px]  mini-nav">
                    <div className={` md:mt-0 flex items-center ${serverList?.data?.length > 0 ? 'justify-between' : 'justify-end'} w-full h-full`}>
                        {serverList?.data?.length > 0 && !isLoading ? (
                            <>
                                <div className="flex items-center h-full">
                                    {/* All service dropdown */}
                                    <ServersListDropdown />

                                    {/* location and ip */}
                                    <div className="hidden  !w-[90px] md:!w-[130px] lg:!w-[260px] lg:flex items-center bg-white rounded-[4px] h-full !px-2 md:!px-[12px]">
                                        <span className="cursor-pointer pt-[2px] md:pt-[5px] checkbox-phn" onClick={() => handleSearchBtn()}>
                                            <SearchIcon />
                                        </span>
                                        <input ref={searchIconRef} className="w-[90px] rounded p-0 text-[8px] md:text-base md:w-full border-none outline-none !focus:outline-none !focus:border-none" placeholder="Search" />
                                    </div>
                                </div>
                                <div className="flex gap-1.5 lg:gap-[10px] items-center">
                                    <div id={`${serverViewLayout == 'grid' && 'grid-menu'}`} onClick={handleServerViewGridLayout} className="popupCpyIcn w-[24px] h-[24px] md:w-[36px] md:h-[38px] flex items-center justify-center bg-white border border-grey100 rounded-[4px] cursor-pointer">
                                        <GridIcon />
                                    </div>

                                    <div id={`${serverViewLayout == 'list' && 'list-menu'}`} onClick={handleServerViewListLayout} className="popupCpyIcn w-[24px] h-[24px] md:w-[36px] md:h-[38px] flex items-center justify-center bg-white border border-grey100 rounded-[4px] cursor-pointer ">
                                        <MenuIcon />
                                    </div>
                                    <CreateServerBtn />
                                </div>
                            </>
                        ) : (
                            <>
                                <CreateServerBtn />
                            </>
                        )}
                    </div>
                </div>
                <div className="pt-3 md:pt-0 main-content">
                    {/* Installing server */}
                    {!isInstalling ? (
                        <>
                            {
                                installingData?.data?.length > 0 && (
                                    <InstallingServers
                                        installingData={installingData.data}
                                        refetch={installingRefetch}
                                    />
                                )
                            }
                        </>
                    ) : (
                        <div className="my-[10px]">
                            <TableBoxSkeleton />
                        </div>
                    )}
                    {!isLoading ? (
                        <>
                            {serverList?.data?.length > 0 || installingData?.data?.length > 0 ? (
                                <HasServer handleGetServerList={handleGetServerList} serverData={serverList?.data} />
                            ) : (
                                <EmptyServerContent />
                            )}

                        </>
                    ) : (
                        <DashboardSkeleton />
                    )}
                </div>
            </div>
        </UserLayout>
    );
}



///server call
'use client'
import EmptyServerContent from '../dashboard/components/empty-server'
import HasServer from '../dashboard/components/has-server'
import InstallingServers from "@/app/dashboard/components/InstallingServers";
import endpoint from "@/utils/endpoint";
import { GridIcon, MenuIcon, SearchIcon, } from "@/assets/icons";
import { useEffect, useRef, useState } from "react";
import ServersListDropdown from "@/components/Shared/ServersListDropdown";
import CreateServerBtn from "@/utils/CreateServerBtn";
import axios from "axios";
import { getCookie } from "@/utils/cookieUtils";
import DashboardSkeleton from '@/utils/Skeleton/DashboardSkeleton/DashboardSkeleton';
import TableBoxSkeleton from '@/utils/Skeleton/Table/SingleRowSkeleton';
import { useGetAllInstallingServerListQuery } from "@/redux/query/PrivateQuery";
import UserLayout from '@/components/layout/UserLayout';

export default function Dashboard() {
    const [serverList, setServerList] = useState(
        typeof window !== "undefined" &&
            JSON.parse(typeof window !== "undefined" ? window.localStorage.getItem('all_server_list') : false)
            ? JSON.parse(typeof window !== "undefined" ? window.localStorage.getItem('all_server_list') : false)
            : {}
    );
    const searchIconRef = useRef(null);
    const [isLoading, setIsloading] = useState(false);
    const [shouldRefetch, setShouldRefetch] = useState(false);
    const [isInstallingLoading, setIsInsallingLoading] = useState(true);
    const [loadingCount, setLoadingCount] = useState(0);

    const { isLoading: isInstalling, data: installingData, refetch: installingRefetch } = useGetAllInstallingServerListQuery();
    const [serverViewLayout, setServerViewLayout] = useState('grid');

    const handleServerViewListLayout = () => {
        setServerViewLayout("list");
        localStorage.setItem("serverLayout", "list");
    }

    const handleServerViewGridLayout = () => {
        setServerViewLayout("grid");
        localStorage.setItem("serverLayout", "grid");
    }

    useEffect(() => {
        let layout = typeof window !== "undefined" ? window.localStorage.getItem('serverLayout') : false;
        if (layout === null) {
            localStorage.setItem("serverLayout", "grid");
            setServerViewLayout('grid');
        } else {
            setServerViewLayout(layout);
        }

    }, [serverViewLayout])

    function handleSearchBtn() {
        searchIconRef.current.focus();
    }

    // get all server list
    const handleGetServerList = async (id) => {
        const apiUrl = `${process.env.NEXT_PUBLIC_CLOUD_URL}${endpoint.dashboard.get_server_list}`;
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getCookie("auth_token")}`,
        };

        try {
            const response = await axios.get(apiUrl, { headers });

            const installingStatusExists = response?.data?.data?.some(obj => obj.status === 'installing');
            if (response?.status === 200) {
                setServerList(response?.data);
                localStorage.setItem('all_server_list', JSON.stringify(response?.data))
            }
            if (installingStatusExists) {
                const timeoutId = setTimeout(() => {
                    if (installingData && installingRefetch) {
                        installingRefetch();

                        // console.log('test res', response)
                    }
                    setShouldRefetch(!shouldRefetch);
                }, 30000);
                return () => clearTimeout(timeoutId);
            } else {
                setServerList(response?.data);
                setIsInsallingLoading(false);
                localStorage.setItem('all_server_list', JSON.stringify(response?.data))
                if (installingData && installingRefetch) {
                    installingRefetch();
                }
            }

        } catch (error) {
            // console.log(error);
        }
    };

    useEffect(() => {
        handleGetServerList();
        if (loadingCount === 0) {
            setLoadingCount(loadingCount + 1);
        }
    }, [shouldRefetch])

    useEffect(() => {
        installingRefetch();
    }, [])
//TODO: server installing data exist in serverList, and installing data
    return (
        <UserLayout>
            <div className="pl-3 pr-3 md:pr-3 xl:pr-0 md:pl-0 w-full main-body">
                <div className="flex items-center justify-start md:mb-[16px]  mini-nav">
                    <div className={` md:mt-0 flex items-center ${serverList?.data?.length > 0 ? 'justify-between' : 'justify-end'} w-full h-full`}>
                        {serverList?.data?.length > 0 && !isLoading ? (
                            <>
                                <div className="flex items-center h-full">
                                    {/* All service dropdown */}
                                    <ServersListDropdown />

                                    {/* location and ip */}
                                    <div className="hidden  !w-[90px] md:!w-[130px] lg:!w-[260px] lg:flex items-center bg-white rounded-[4px] h-full !px-2 md:!px-[12px]">
                                        <span className="cursor-pointer pt-[2px] md:pt-[5px] checkbox-phn" onClick={() => handleSearchBtn()}>
                                            <SearchIcon />
                                        </span>
                                        <input ref={searchIconRef} className="w-[90px] rounded p-0 text-[8px] md:text-base md:w-full border-none outline-none !focus:outline-none !focus:border-none" placeholder="Search" />
                                    </div>
                                </div>
                                <div className="flex gap-1.5 lg:gap-[10px] items-center">
                                    <div id={`${serverViewLayout == 'grid' && 'grid-menu'}`} onClick={handleServerViewGridLayout} className="popupCpyIcn w-[24px] h-[24px] md:w-[36px] md:h-[38px] flex items-center justify-center bg-white border border-grey100 rounded-[4px] cursor-pointer">
                                        <GridIcon />
                                    </div>

                                    <div id={`${serverViewLayout == 'list' && 'list-menu'}`} onClick={handleServerViewListLayout} className="popupCpyIcn w-[24px] h-[24px] md:w-[36px] md:h-[38px] flex items-center justify-center bg-white border border-grey100 rounded-[4px] cursor-pointer ">
                                        <MenuIcon />
                                    </div>
                                    <CreateServerBtn />
                                </div>
                            </>
                        ) : (
                            <>
                                <CreateServerBtn />
                            </>
                        )}
                    </div>
                </div>
                <div className="pt-3 md:pt-0 main-content">
                    {/* Installing server */}
                    {!isInstalling ? (
                        <>
                            {
                                installingData?.data?.length > 0 && (
                                    <InstallingServers
                                        installingData={installingData.data}
                                        refetch={installingRefetch}
                                    />
                                )
                            }
                        </>
                    ) : (
                        <div className="my-[10px]">
                            <TableBoxSkeleton />
                        </div>
                    )}
                    {!isLoading ? (
                        <>
                            {serverList?.data?.length > 0 || installingData?.data?.length > 0 ? (
                                <HasServer handleGetServerList={handleGetServerList} serverData={serverList?.data} />
                            ) : (
                                <EmptyServerContent />
                            )}

                        </>
                    ) : (
                        <DashboardSkeleton />
                    )}
                </div>
            </div>
        </UserLayout>
    );
}
