import axios from "axios";
import { ElMessageBox, ElMessage } from "element-plus";
import { showFullScreenLoading, tryHideFullScreenLoading } from "@/config/serviceLoading";
import { getToken } from "@/utils/cookies";
import { qiankunWindow } from "vite-plugin-qiankun/dist/helper";
import { useUserStore } from "@/store/modules/user";
export default (config: any) => {
  // 创建axios实例
  const service: any = axios.create({
    baseURL: import.meta.env.VITE_APP_BASE_API as string,
    // 超时
    timeout: 50000
  });
  // 请求拦截器
  service.interceptors.request.use(
    (config: any) => {
      if (!(config.url.includes("portal-sso") || config.url.includes("portal-user"))) {
        config.url = `/mes${config.url}`;
      }
      // 当前请求不需要显示 loading，在 api 服务中通过指定的第三个参数: { noLoading: true } 来控制
      config.noLoading || showFullScreenLoading();
      config.headers["Authorization"] = getToken() || "";
      // config.headers['Authorization'] = 'PC:90_d6164543c758402d815604f5f698098d'
      config.headers["Content-Type"] = config.headers["Content-Type"] || "application/json";
      // 8080
      if (config.type == "file") {
        config.headers["content-type"] = "application/multipart/form-data";
      } else if (config.type == "form") {
        config.headers["Content-type"] = "application/x-www-form-urlencoded";
      }
      if (config.method && config.method.toLowerCase() === "get") {
        config.data = true;
      }
      return config;
    },
    (error: any) => {
      return Promise.reject(error);
    }
  );
  // 响应拦截器
  service.interceptors.response.use(
    (response: any) => {
      const code = response.data.code;
      tryHideFullScreenLoading();
      if (code === 401) {
        ElMessageBox.confirm("登录状态已过期，您可以继续留在该页面，或者重新登录", "系统提示", {
          confirmButtonText: "重新登录",
          cancelButtonText: "取消",
          type: "warning"
        }).then(() => {
          // 调用退出登录接口
          useUserStore().FedLogOut();
          window.location.href = qiankunWindow.__POWERED_BY_QIANKUN__ ? "/wocwin-qiankun/" : "/wocwin-admin/";
        });
      } else if (code !== 200) {
        ElMessage({
          message: response.data.msg,
          type: "error",
          duration: 5 * 1000
        });
        return Promise.reject("error");
      } else {
        return response.data;
      }
    },
    (error: any) => {
      tryHideFullScreenLoading();
      ElMessage({
        message: error.message,
        type: "error",
        duration: 5 * 1000
      });
      return Promise.reject(error);
    }
  );
  return service(config);
};
