// libs/api/index.ts
export * from "./config";
export * from "./auth";
export * from "./product";
export * from "./stone";
export * from "./factory";
export * from "./classification";
export * from "./material";
export * from "./setType";
export * from "./color";
export * from "./store";

// 기존 호환성을 위한 통합 객체 (점진적 마이그레이션용)
import { productApi } from "./product";
import { stoneApi } from "./stone";
import { factoryApi } from "./factory";
import { classificationApi } from "./classification";
import { materialApi } from "./material";
import { setTypeApi } from "./setType";
import { colorApi } from "./color";

export const productInfoApi = {
    // Product APIs
    getProductCategories: productApi.getProductCategories,
    getProducts: productApi.getProducts,
    updateProduct: productApi.updateProduct,

    // Classification APIs
    getClassifications: classificationApi.getClassifications,

    // Material APIs
    getMaterials: materialApi.getMaterials,

    // SetType APIs
    getSetTypes: setTypeApi.getSetTypes,

    // Color APIs
    getColor: colorApi.getColors, // 기존 이름 호환성
    getColors: colorApi.getColors,

    // Stone APIs  
    getStones: stoneApi.getStones,

    // Factory APIs
    getFactories: factoryApi.getFactories,
};
