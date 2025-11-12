const { supabase, supabaseService } = require('../config/supabase');

/**
 * 数据库服务类
 * 封装Supabase数据库操作，支持模拟模式
 */
class DatabaseService {
  constructor() {
    this.simulatedMode = false;
    this.memoryData = {
      users: [],
      travel_plans: [],
      travel_nodes: []
    };
    
    try {
      this.supabase = supabase;
      this.supabaseService = supabaseService;
      console.log('DatabaseService 初始化完成');
    } catch (error) {
      console.warn('无法初始化Supabase客户端，将以模拟模式运行:', error.message);
      this.simulatedMode = true;
    }
  }
  
  /**
   * 生成唯一ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  /**
   * 模拟查询
   */
  simulateQuery(table, options = {}) {
    let data = [...(this.memoryData[table] || [])];
    
    // 条件过滤
    if (options.filters && typeof options.filters === 'object') {
      data = data.filter(item => {
        return Object.entries(options.filters).every(([field, value]) => {
          return item[field] === value;
        });
      });
    }
    
    // 排序
    if (options.order) {
      const { field, ascending = true } = options.order;
      data.sort((a, b) => {
        if (a[field] < b[field]) return ascending ? -1 : 1;
        if (a[field] > b[field]) return ascending ? 1 : -1;
        return 0;
      });
    }
    
    // 限制和偏移
    if (options.offset) {
      data = data.slice(options.offset);
    }
    if (options.limit) {
      data = data.slice(0, options.limit);
    }
    
    // 选择字段
    if (options.select) {
      const fields = options.select.split(',');
      data = data.map(item => {
        const selected = {};
        fields.forEach(field => {
          if (item.hasOwnProperty(field.trim())) {
            selected[field.trim()] = item[field.trim()];
          }
        });
        return selected;
      });
    }
    
    return { success: true, data, simulated: this.simulatedMode };
  }

  /**
   * 通用查询方法
   * @param {string} table - 表名
   * @param {object} options - 查询选项
   */
  async query(table, options = {}) {
    if (this.simulatedMode) {
      return this.simulateQuery(table, options);
    }
    
    try {
      let query = this.supabase.from(table);
      
      // 选择字段
      if (options.select) {
        query = query.select(options.select);
      }
      
      // 条件过滤
      if (options.filters && typeof options.filters === 'object') {
        Object.entries(options.filters).forEach(([field, value]) => {
          query = query.eq(field, value);
        });
      }
      
      // 排序
      if (options.order) {
        const { field, ascending = true } = options.order;
        query = query.order(field, { ascending });
      }
      
      // 限制
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      // 偏移
      if (options.offset) {
        query = query.offset(options.offset);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.warn(`数据库查询错误，切换到模拟模式 [${table}]:`, error.message);
        this.simulatedMode = true;
        return this.simulateQuery(table, options);
      }
      
      return { success: true, data };
    } catch (error) {
      console.warn(`数据库查询异常，切换到模拟模式 [${table}]:`, error.message);
      this.simulatedMode = true;
      return this.simulateQuery(table, options);
    }
  }
  
  /**
   * 模拟创建记录
   */
  simulateCreate(table, data) {
    if (!this.memoryData[table]) {
      this.memoryData[table] = [];
    }
    
    // 添加ID和时间戳
    const newRecord = {
      ...data,
      id: data.id || this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.memoryData[table].push(newRecord);
    return { success: true, data: newRecord, simulated: this.simulatedMode };
  }

  /**
   * 创建记录
   * @param {string} table - 表名
   * @param {object} data - 要插入的数据
   */
  async create(table, data) {
    if (this.simulatedMode) {
      return this.simulateCreate(table, data);
    }
    
    try {
      const { data: result, error } = await this.supabase.from(table).insert(data).select();
      
      if (error) {
        console.warn(`数据库创建错误，切换到模拟模式 [${table}]:`, error.message);
        this.simulatedMode = true;
        return this.simulateCreate(table, data);
      }
      
      return { success: true, data: result[0] };
    } catch (error) {
      console.warn(`数据库创建异常，切换到模拟模式 [${table}]:`, error.message);
      this.simulatedMode = true;
      return this.simulateCreate(table, data);
    }
  }
  
  /**
   * 模拟更新记录
   */
  simulateUpdate(table, filters, data) {
    if (!this.memoryData[table]) {
      return { success: false, error: '表不存在' };
    }
    
    let updatedRecords = [];
    
    this.memoryData[table] = this.memoryData[table].map(item => {
      let shouldUpdate = true;
      
      if (filters && typeof filters === 'object') {
        shouldUpdate = Object.entries(filters).every(([field, value]) => {
          return item[field] === value;
        });
      }
      
      if (shouldUpdate) {
        const updatedItem = {
          ...item,
          ...data,
          updated_at: new Date().toISOString()
        };
        updatedRecords.push(updatedItem);
        return updatedItem;
      }
      
      return item;
    });
    
    return { 
      success: updatedRecords.length > 0, 
      data: updatedRecords,
      simulated: this.simulatedMode 
    };
  }

  /**
   * 更新记录
   * @param {string} table - 表名
   * @param {object} filters - 过滤条件
   * @param {object} data - 要更新的数据
   */
  async update(table, filters, data) {
    if (this.simulatedMode) {
      return this.simulateUpdate(table, filters, data);
    }
    
    try {
      let query = this.supabase.from(table);
      
      // 应用过滤条件
      if (filters && typeof filters === 'object') {
        Object.entries(filters).forEach(([field, value]) => {
          query = query.eq(field, value);
        });
      }
      
      const { data: result, error } = await query.update(data).select();
      
      if (error) {
        console.warn(`数据库更新错误，切换到模拟模式 [${table}]:`, error.message);
        this.simulatedMode = true;
        return this.simulateUpdate(table, filters, data);
      }
      
      return { success: true, data: result };
    } catch (error) {
      console.warn(`数据库更新异常，切换到模拟模式 [${table}]:`, error.message);
      this.simulatedMode = true;
      return this.simulateUpdate(table, filters, data);
    }
  }
  
  /**
   * 模拟删除记录
   */
  simulateDelete(table, filters) {
    if (!this.memoryData[table]) {
      return { success: false, error: '表不存在' };
    }
    
    const initialLength = this.memoryData[table].length;
    
    this.memoryData[table] = this.memoryData[table].filter(item => {
      if (!filters || typeof filters !== 'object') {
        return true; // 没有过滤条件时不删除
      }
      
      return !Object.entries(filters).every(([field, value]) => {
        return item[field] === value;
      });
    });
    
    const deletedCount = initialLength - this.memoryData[table].length;
    
    return {
      success: deletedCount > 0,
      deletedCount,
      simulated: this.simulatedMode
    };
  }

  /**
   * 删除记录
   * @param {string} table - 表名
   * @param {object} filters - 过滤条件
   */
  async delete(table, filters) {
    if (this.simulatedMode) {
      return this.simulateDelete(table, filters);
    }
    
    try {
      let query = this.supabase.from(table);
      
      // 应用过滤条件
      if (filters && typeof filters === 'object') {
        Object.entries(filters).forEach(([field, value]) => {
          query = query.eq(field, value);
        });
      }
      
      const { data, error, count } = await query.delete();
      
      if (error) {
        console.warn(`数据库删除错误，切换到模拟模式 [${table}]:`, error.message);
        this.simulatedMode = true;
        return this.simulateDelete(table, filters);
      }
      
      return { success: true, deletedCount: count };
    } catch (error) {
      console.warn(`数据库删除异常，切换到模拟模式 [${table}]:`, error.message);
      this.simulatedMode = true;
      return this.simulateDelete(table, filters);
    }
  }
  
  /**
   * 模拟获取单个记录
   */
  simulateGetOne(table, filters) {
    if (!this.memoryData[table]) {
      return { success: true, data: null };
    }
    
    const record = this.memoryData[table].find(item => {
      if (!filters || typeof filters !== 'object') {
        return true;
      }
      
      return Object.entries(filters).every(([field, value]) => {
        return item[field] === value;
      });
    });
    
    return { success: true, data: record || null, simulated: this.simulatedMode };
  }

  /**
   * 获取单个记录
   * @param {string} table - 表名
   * @param {object} filters - 过滤条件
   */
  async getOne(table, filters) {
    if (this.simulatedMode) {
      return this.simulateGetOne(table, filters);
    }
    
    try {
      const { data, error } = await this.supabase
        .from(table)
        .select()
        .match(filters)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return { success: true, data: null };
        }
        console.warn(`获取单个记录错误，切换到模拟模式 [${table}]:`, error.message);
        this.simulatedMode = true;
        return this.simulateGetOne(table, filters);
      }
      
      return { success: true, data };
    } catch (error) {
      console.warn(`获取单个记录异常，切换到模拟模式 [${table}]:`, error.message);
      this.simulatedMode = true;
      return this.simulateGetOne(table, filters);
    }
  }
  
  /**
   * 模拟批量创建
   */
  simulateBulkCreate(table, dataArray) {
    if (!this.memoryData[table]) {
      this.memoryData[table] = [];
    }
    
    const createdItems = [];
    for (const item of dataArray) {
      const newRecord = {
        ...item,
        id: item.id || this.generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.memoryData[table].push(newRecord);
      createdItems.push(newRecord);
    }
    
    return { success: true, data: createdItems, simulated: this.simulatedMode };
  }

  /**
   * 批量创建
   * @param {string} table - 表名
   * @param {array} dataArray - 数据数组
   */
  async bulkCreate(table, dataArray) {
    if (this.simulatedMode) {
      return this.simulateBulkCreate(table, dataArray);
    }
    
    try {
      const { data, error } = await this.supabase.from(table).insert(dataArray).select();
      
      if (error) {
        console.warn(`批量创建错误，切换到模拟模式 [${table}]:`, error.message);
        this.simulatedMode = true;
        return this.simulateBulkCreate(table, dataArray);
      }
      
      return { success: true, data };
    } catch (error) {
      console.warn(`批量创建异常，切换到模拟模式 [${table}]:`, error.message);
      this.simulatedMode = true;
      return this.simulateBulkCreate(table, dataArray);
    }
  }

  /**
   * 执行原始SQL查询
   * @param {string} sql - SQL查询语句
   */
  async executeRawSQL(sql) {
    // 在模拟模式下，返回空结果
    if (this.simulatedMode) {
      console.warn('模拟模式下不支持执行原始SQL');
      return { success: true, data: [], simulated: this.simulatedMode };
    }
    
    try {
      // 只使用服务端客户端执行原始SQL
      const { data, error } = await this.supabaseService.rpc('execute_sql', { sql });
      
      if (error) {
        console.warn('执行原始SQL错误，切换到模拟模式:', error.message);
        this.simulatedMode = true;
        return { success: true, data: [], simulated: this.simulatedMode };
      }
      
      return { success: true, data };
    } catch (error) {
      console.warn('执行原始SQL异常，切换到模拟模式:', error.message);
      this.simulatedMode = true;
      return { success: true, data: [], simulated: this.simulatedMode };
    }
  }
}

module.exports = new DatabaseService();