import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // ✅ AGREGAR useAuth
import Header from '../../components/Layout/Header';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import { vendorService } from '../../services/dataService';
import './Vendors.css';

const Vendors = () => {
  const { user } = useAuth(); // ✅ AGREGAR usuario autenticado
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({
    No_: '',
    Name: '',
    SearchName: '',
    Address: '',
    Address2: '',
    City: '',
    PostCode: '',
    CountryRegionCode: 'CO',
    PhoneNo: '',
    Email: '',
    Contact: '',
    VATRegistrationNo: '',
    VATRegistrationType: 'NIT',
    VendorPostingGroup: 'NACIONAL',
    PaymentTermsCode: 'CONTADO',
    CurrencyCode: 'COP',
    BalanceLCY: 0,
    Blocked: 'No',
    CreatedAt: new Date().toISOString()
  });

  // ✅ ACTUALIZAR useEffect para verificar usuario
  useEffect(() => {
    if (user) {
      fetchVendors();
    }
  }, [user]);

  // ✅ AGREGAR debug log
  useEffect(() => {
    console.log('Vendors formData:', formData);
  }, [formData]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await vendorService.getAll();
      console.log(`Proveedores cargados para usuario ${user.id}:`, response.data.length); // ✅ AGREGAR log
      setVendors(response.data);
    } catch (err) {
      setError('Error al cargar proveedores');
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await vendorService.update(editingVendor['No_'], formData);
        setVendors(vendors.map(v => 
          v['No_'] === editingVendor['No_'] ? { ...v, ...formData } : v
        ));
        console.log(`Proveedor ${editingVendor['No_']} actualizado para usuario ${user.id}`); // ✅ AGREGAR log
      } else {
        await vendorService.create(formData);
        await fetchVendors(); // ✅ RECARGAR la lista después de crear
        console.log(`Proveedor ${formData.No_} creado para usuario ${user.id}`); // ✅ AGREGAR log
      }
      
      resetForm();
    } catch (err) {
      setError(`Error al guardar proveedor: ${err.response?.data?.message || err.message}`); // ✅ MEJORAR mensaje de error
      console.error('Error saving vendor:', err);
    }
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({ ...vendor });
    setShowForm(true);
  };

  const handleDelete = async (vendorId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
      try {
        await vendorService.delete(vendorId);
        setVendors(vendors.filter(v => v['No_'] !== vendorId));
        console.log(`Proveedor ${vendorId} eliminado para usuario ${user.id}`); // ✅ AGREGAR log
      } catch (err) {
        setError(`Error al eliminar proveedor: ${err.response?.data?.message || err.message}`); // ✅ MEJORAR mensaje de error
        console.error('Error deleting vendor:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      No_: '',
      Name: '',
      SearchName: '',
      Address: '',
      Address2: '',
      City: '',
      PostCode: '',
      CountryRegionCode: 'CO',
      PhoneNo: '',
      Email: '',
      Contact: '',
      VATRegistrationNo: '',
      VATRegistrationType: 'NIT',
      VendorPostingGroup: 'NACIONAL',
      PaymentTermsCode: 'CONTADO',
      CurrencyCode: 'COP',
      BalanceLCY: 0,
      Blocked: 'No',
      CreatedAt: new Date().toISOString()
    });
    setEditingVendor(null);
    setShowForm(false);
    setError(null);
  };

  if (loading) return <div className="loading">Cargando proveedores...</div>;

  return (
    <div className="vendors">
      <Header title={`Gestión de Proveedores - ${user?.firstName || 'Usuario'}`} />
      
      {/* ✅ AGREGAR botón fuera del Header */}
      <div className="page-actions">
        <Button onClick={() => setShowForm(true)}>+ Nuevo Proveedor</Button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingVendor ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
              <button onClick={resetForm} className="close-button">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="vendor-form">
              <div className="form-grid">
                <Input
                  label="Código"
                  name="No_"
                  value={formData.No_}
                  onChange={handleInputChange}
                  required
                  disabled={editingVendor}
                />
                
                <Input
                  label="Nombre"
                  name="Name"
                  value={formData.Name}
                  onChange={handleInputChange}
                  required
                />
                
                <Input
                  label="Nombre de Búsqueda"
                  name="SearchName"
                  value={formData.SearchName}
                  onChange={handleInputChange}
                />
                
                <Input
                  label="Dirección"
                  name="Address"
                  value={formData.Address}
                  onChange={handleInputChange}
                />
                
                <Input
                  label="Dirección 2"
                  name="Address2"
                  value={formData.Address2}
                  onChange={handleInputChange}
                />
                
                <Input
                  label="Ciudad"
                  name="City"
                  value={formData.City}
                  onChange={handleInputChange}
                />
                
                <Input
                  label="Código Postal"
                  name="PostCode"
                  value={formData.PostCode}
                  onChange={handleInputChange}
                />
                
                <Input
                  label="Teléfono"
                  name="PhoneNo"
                  value={formData.PhoneNo}
                  onChange={handleInputChange}
                />
                
                <Input
                  label="Email"
                  name="Email"
                  type="email"
                  value={formData.Email}
                  onChange={handleInputChange}
                />
                
                <Input
                  label="Contacto"
                  name="Contact"
                  value={formData.Contact}
                  onChange={handleInputChange}
                />
                
                <Input
                  label="NIT/RUT"
                  name="VATRegistrationNo"
                  value={formData.VATRegistrationNo}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-actions">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingVendor ? 'Actualizar' : 'Crear'} Proveedor
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="vendors-table-container">
        <table className="vendors-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Ciudad</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor['No_']}>
                <td className="vendor-code">{vendor['No_']}</td>
                <td>
                  <div className="vendor-info">
                    <div className="vendor-name">{vendor.Name}</div>
                    {vendor.Contact && (
                      <div className="vendor-contact">Contacto: {vendor.Contact}</div>
                    )}
                  </div>
                </td>
                <td>{vendor.City || '-'}</td>
                <td>{vendor['Phone No_'] || '-'}</td>
                <td>{vendor['E-Mail'] || '-'}</td>
                <td>
                  <span className={`status ${vendor.Blocked === 'No' ? 'active' : 'blocked'}`}>
                    {vendor.Blocked === 'No' ? 'Activo' : 'Bloqueado'}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <Button 
                      variant="outline" 
                      size="small"
                      onClick={() => handleEdit(vendor)}
                    >
                      Editar
                    </Button>
                    <Button 
                      variant="error" 
                      size="small"
                      onClick={() => handleDelete(vendor['No_'])}
                    >
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {vendors.length === 0 && (
          <div className="empty-state">
            <p>No tienes proveedores registrados</p> {/* ✅ CAMBIAR mensaje */}
            <Button onClick={() => setShowForm(true)}>+ Agregar primer proveedor</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vendors;
