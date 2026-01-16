/**
 * Partner/Customer Types for Sales Maximus Mobile
 * 
 * 1C ERP ХОЛБОЛТ:
 * - Companies API: /hs/cl/Companies
 * - Tasks API: /hs/ts/Tasks
 * 
 * BUSINESS RULE - ИРСЭН/ЗАЙ ХОЛ ТОДОРХОЙЛОЛТ:
 * 
 * 1. coordinateRange = 1 бол:
 *    → Шууд "Ирсэн" гэж тооцно (GPS шалгахгүй)
 *    → Зарим харилцагчид GPS-гүй, гар утсаар захиалга өгдөг
 * 
 * 2. coordinateRange != 1 бол:
 *    → GPS зай <= routeRange бол "Ирсэн"
 *    → GPS зай > routeRange бол "Зай хол"
 *    → routeRange: 1C ERP-ээс ирнэ (ихэвчлэн 2000м = 2км)
 */

export interface Partner {
  /** Харилцагчийн UUID (1C ERP-ээс) */
  id: string;
  /** Харилцагчийн нэр */
  name: string;
  /** Утасны дугаар */
  phone: string | null;
  /** Имэйл хаяг */
  email: string | null;
  /** Гудамж 1 */
  street1: string | null;
  /** Гудамж 2 */
  street2: string | null;
  /** Хот/Дүүрэг */
  city: string | null;
  /** Бүтэн хаяг */
  address: string | null;
  /** What3Words хаяг (///гурван.үг.хаяг) */
  w3w: string | null;
  /** 1C ERP UUID */
  erp_uuid: string | null;
  
  // ==========================================================================
  // ERP НЭМЭЛТ ТАЛБАРУУД
  // ==========================================================================
  
  /** GPS уртраг */
  longitude: number | null;
  /** GPS өргөрөг */
  latitude: number | null;
  /** Авлагын үлдэгдэл (₮) */
  balance: number | null;
  /** Авлагын хязгаар */
  debtLimit: number | null;
  /** Авлагын хоног */
  debtDays: number | null;
  /** Борлуулалтын хязгаар */
  salesLimit: number | null;
  /** Маршрутын ID */
  routeId: string | null;
  /** Маршрутын нэр */
  routeName: string | null;
  
  /**
   * ЧУХАЛ BUSINESS RULE:
   * - coordinateRange = 1: GPS шалгахгүй, автоматаар "Ирсэн"
   * - coordinateRange != 1: GPS зайг routeRange-тэй харьцуулна
   */
  coordinateRange: number | null;
  
  // ==========================================================================
  // КОМПАНИЙН МЭДЭЭЛЭЛ
  // ==========================================================================
  
  /** Компанийн код (1C хайлтад ашиглагдана) */
  companyCode: string | null;
  /** Толгой компанийн нэр */
  headCompanyName: string | null;
  /** Регистрийн дугаар */
  headCompanyRegister: string | null;
  /** Харилцагчийн зураг */
  image: string | null;
  
  // ==========================================================================
  // ТООЦООЛСОН ТАЛБАРУУД (APP ДОТОР)
  // ==========================================================================
  
  /**
   * GPS зай (км)
   * - App дотор тооцоологдоно (Haversine formula)
   * - Хэрэглэгчийн байршлаас харилцагч хүртэлх зай
   * - Ирсэн/Зай хол тодорхойлоход ашиглагдана
   */
  distance?: number;
  
  // Timestamps
  created_at: string | null;
  updated_at: string | null;
}

export interface PartnerFilters {
  search?: string;
  routeId?: string;
  page?: number;
  pageSize?: number;
}

/**
 * PartnerTabType: Харилцагчийн tab шүүлтүүд
 * - 'all': Бүх харилцагч
 * - 'visited': Ирсэн (coordinateRange=1 ЭСВЭЛ GPS зай <= routeRange)
 * - 'far': Зай хол (coordinateRange!=1 МӨНӨӨС GPS зай > routeRange)
 */
export type PartnerTabType = 'all' | 'visited' | 'far';
