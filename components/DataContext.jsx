import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Student } from '@/entities/Student';
import { Center } from '@/entities/Center';
import { Address } from '@/entities/Address';
import { toast } from 'sonner';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData debe ser usado dentro de DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  // Estado de datos globales
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [centers, setCenters] = useState([]);
  const [addresses, setAddresses] = useState([]);
  
  // Estado de carga y errores
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastLoadTime, setLastLoadTime] = useState(null);

  // Cargar usuario actual
  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      return user;
    } catch (error) {
      console.error('Error cargando usuario actual:', error);
      setCurrentUser(null);
      throw error;
    }
  };

  // Cargar todos los datos
  const loadData = async (forceReload = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Cargar usuario actual primero
      const user = await loadCurrentUser();
      
      // Solo cargar datos si el usuario está autenticado
      if (user) {
        // Cargar datos en paralelo
        const [usersData, studentsData, centersData, addressesData] = await Promise.all([
          User.list('-created_date', 1000).catch(() => []),
          Student.list('-created_date', 1000).catch(() => []),
          Center.list('-created_date', 1000).catch(() => []),
          Address.list('-created_date', 1000).catch(() => [])
        ]);

        setUsers(usersData);
        setStudents(studentsData);
        setCenters(centersData);
        setAddresses(addressesData);
        setLastLoadTime(new Date());
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError(error.message);
      toast.error('Error cargando datos del sistema');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos específicos
  const loadUsers = async () => {
    try {
      const usersData = await User.list('-created_date', 1000);
      setUsers(usersData);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      toast.error('Error cargando usuarios');
    }
  };

  const loadStudents = async () => {
    try {
      const studentsData = await Student.list('-created_date', 1000);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error cargando alumnos:', error);
      toast.error('Error cargando alumnos');
    }
  };

  const loadCenters = async () => {
    try {
      const centersData = await Center.list('-created_date', 1000);
      setCenters(centersData);
    } catch (error) {
      console.error('Error cargando centros:', error);
      toast.error('Error cargando centros');
    }
  };

  const loadAddresses = async () => {
    try {
      const addressesData = await Address.list('-created_date', 1000);
      setAddresses(addressesData);
    } catch (error) {
      console.error('Error cargando direcciones:', error);
      toast.error('Error cargando direcciones');
    }
  };

  // Funciones de utilidad
  const refreshData = async () => {
    await loadData(true);
  };

  const clearData = () => {
    setUsers([]);
    setStudents([]);
    setCenters([]);
    setAddresses([]);
    setCurrentUser(null);
    setError(null);
    setLastLoadTime(null);
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, []);

  // Función para obtener datos filtrados
  const getFilteredData = (dataType, filters = {}) => {
    let data = [];
    
    switch (dataType) {
      case 'users':
        data = users;
        break;
      case 'students':
        data = students;
        break;
      case 'centers':
        data = centers;
        break;
      case 'addresses':
        data = addresses;
        break;
      default:
        return [];
    }

    // Aplicar filtros
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (Array.isArray(value)) {
          return value.length === 0 || value.includes(item[key]);
        }
        if (typeof value === 'string') {
          return !value || item[key]?.toLowerCase().includes(value.toLowerCase());
        }
        return !value || item[key] === value;
      });
    });
  };

  // Función para buscar por texto
  const searchData = (dataType, searchTerm, fields = []) => {
    if (!searchTerm) return getFilteredData(dataType);
    
    const data = getFilteredData(dataType);
    const term = searchTerm.toLowerCase();
    
    return data.filter(item => {
      if (fields.length === 0) {
        // Buscar en todos los campos de texto
        return Object.values(item).some(value => 
          typeof value === 'string' && value.toLowerCase().includes(term)
        );
      } else {
        // Buscar solo en campos específicos
        return fields.some(field => 
          item[field]?.toLowerCase().includes(term)
        );
      }
    });
  };

  const value = {
    // Datos
    currentUser,
    users,
    students,
    centers,
    addresses,
    
    // Estado
    isLoading,
    error,
    lastLoadTime,
    
    // Funciones de carga
    loadData,
    loadUsers,
    loadStudents,
    loadCenters,
    loadAddresses,
    refreshData,
    clearData,
    
    // Funciones de utilidad
    getFilteredData,
    searchData,
    
    // Setters para actualizaciones optimistas
    setUsers,
    setStudents,
    setCenters,
    setAddresses,
    setCurrentUser
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

