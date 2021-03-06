import { Capacitor } from "@capacitor/core";
import { Toast } from "@capacitor/toast";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import classNames from "classnames";
import { useCallback, useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AppContext } from "../AppContext";
import { IAccount } from "../Models/AppContext";
import VLC, { ISettings } from "../Plugins/VLC";
import "./Account.scss";

export default function Account() {
    const { context, setContext } = useContext(AppContext);
    const [offlineMode, setOfflineMode] = useState<boolean>(false);
    const logout = useCallback(() => {
        const newContext: IAccount = {
            username: null,
            url: "",
            password: "",
            type: "",
            usePlaintext: false,
        };
        setContext(newContext);
    }, [setContext]);

    const { focused, ref } = useFocusable({ onEnterPress: logout });
    const {
        register,
        handleSubmit,
        setFocus,
        formState: { errors },
        setValue,
    } = useForm<ISettings>();
    const { focused: saveSettingsFocused, ref: saveSettingsRef } = useFocusable(
        {
            onEnterPress: () => {
                handleSubmit(hash);
            },
        }
    );

    const hash = useCallback(async (data: ISettings) => {
        const ret = await VLC.setSettings(data);
        if (ret.status === "ok") {
            Toast.show({ text: "Settings saved correctly" });
        } else {
            Toast.show({ text: ret.error });
        }
    }, []);
    useEffect(() => {
        const f = async () => {
            try {
                const settings = await VLC.getSettings();
                if (Capacitor.getPlatform() === "android") {
                    const cacheSize = settings.value?.cacheSize;
                    setValue("cacheSize", cacheSize!);
                }
                const transcoding = settings.value?.transcoding ?? "";
                setValue("transcoding", transcoding);
                const offlineMode = (await VLC.getOfflineMode()).value;
                setOfflineMode(offlineMode!);
            } catch (e: any) {
                setValue("cacheSize", 0);
                Toast.show({
                    text: "There was an error retrieving settings from the Phone.",
                });
            }
        };
        f();
    }, [setValue]);
    const onSubmit = handleSubmit(hash);
    const { ref: cacheSizeRef, focused: cacheSizeFocused } = useFocusable({
        onEnterPress: () => {
            setFocus("cacheSize");
        },
    });
    const handleChange = useCallback(
        async (target: any) => {
            const newOfflineMode = (
                await VLC.setOfflineMode({ value: !offlineMode })
            ).value;
            setOfflineMode(newOfflineMode!);
            Toast.show({
                text: `Offline mode ${newOfflineMode ? "enabled" : "disabled"}`,
            });
        },
        [offlineMode]
    );
    return (
        <div className="d-flex flex-column align-items-center justify-content-start overflow-scroll scrollable">
            <div className="d-flex flex-column align-items-center justify-content-start w-100">
                <div className="text-white account-icon-container">
                    <FontAwesomeIcon icon={faUser} size="5x"></FontAwesomeIcon>
                </div>
                <div className="text-header text-white">{context.username}</div>
                <div className="text-white">on {context.url}</div>
                <div className="text-white">running {context.type}</div>
                {context.usePlaintext && (
                    <div className="text-danger">using plaintext password</div>
                )}
                <div className="logout-button-container">
                    <button
                        ref={ref}
                        className={classNames(
                            "btn",
                            "mt-10",
                            focused ? "btn-selected" : "btn-primary"
                        )}
                        onClick={logout}
                    >
                        Logout
                    </button>
                </div>
            </div>

            <hr className="w-100 text-white" />
            <form className="h-100 w-100" onSubmit={onSubmit}>
                <div className="d-flex flex-column h-100 justify-content-start align-items-start">
                    <div className="section-header text-white">Transcoding</div>
                    <div
                        ref={cacheSizeRef}
                        className="input-group mb-2 mr-sm-2"
                    >
                        <input
                            {...register("transcoding")}
                            type="text"
                            className={classNames(
                                "form-control",
                                cacheSizeFocused ? "form-focused" : ""
                            )}
                            placeholder="Transcoding"
                        />
                    </div>
                    <div className="subtitle text-white">
                        The transcoding setting name used for streaming music.
                        (May appear as "format" in your server){" "}
                        {Capacitor.getPlatform() === "android" &&
                            "(Used only with mobile data, on WIFI the client won't ask for transcoding.)"}
                    </div>
                    {Capacitor.getPlatform() === "android" && (
                        <>
                            <div className="section-header text-white">
                                Cache settings
                            </div>
                            <div
                                ref={cacheSizeRef}
                                className="input-group mb-2 mr-sm-2"
                            >
                                <input
                                    {...register("cacheSize", {
                                        required: {
                                            message: "This value is required",
                                            value: true,
                                        },
                                        min: 0,
                                    })}
                                    type="number"
                                    className={classNames(
                                        "form-control",
                                        cacheSizeFocused ? "form-focused" : ""
                                    )}
                                    placeholder="Cache size"
                                />
                                <div className="input-group-append">
                                    <div className="input-group-text">GB</div>
                                </div>
                            </div>
                            <div className="subtitle text-white">
                                Maximum storage space dedicated to the songs
                                cache (0: No limit)
                            </div>
                            {errors && errors.cacheSize && (
                                <div className="subtitle text-danger">
                                    {errors.cacheSize.message}
                                </div>
                            )}
                            <div className="section-header text-white">
                                Offline Mode
                            </div>
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={offlineMode}
                                    onChange={handleChange}
                                    id="flexSwitchCheckDefault"
                                />
                            </div>
                            <div className="subtitle text-white">
                                Offline Mode (Will use the downloaded songs as
                                library)
                            </div>
                        </>
                    )}
                    <div className="d-flex flex-row align-items-center justify-content-end w-100 mt-3">
                        <button
                            ref={saveSettingsRef}
                            className={classNames(
                                "btn",
                                "btn-primary",
                                saveSettingsFocused
                                    ? "btn-selected"
                                    : "btn-primary"
                            )}
                        >
                            Save settings
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
