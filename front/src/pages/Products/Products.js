import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Agregar useAuth
import Header from '../../components/Layout/Header';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import { itemService, vendorService } from '../../services/dataService';
import './Products.css';

const Products = () => {
  const { user } = useAuth(); // Obtener usuario autenticado
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    No_: '',
    Description: '',
    Description2: '',
    BaseUnitOfMeasure: 'UND',
    Inventory: '',
    UnitCost: '',
    LastDirectCost: '',
    UnitPrice: '',
    ItemCategoryCode: '',
    ProductGroupCode: '',
    InventoryPostingGroup: 'INV01',
    VendorNo: '',
    Blocked: 'No',
    CreatedAt: new Date().toISOString()
  });

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchVendors();
    }
  }, [user]);

  // Debug: log formData cuando cambie
  useEffect(() => {
    console.log('Products formData:', formData);
  }, [formData]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await itemService.getAll();
      console.log(`Productos cargados para usuario ${user.id}:`, response.data.length);
      setProducts(response.data);
    } catch (err) {
      setError('Error al cargar productos');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await vendorService.getAll();
      console.log(`Proveedores cargados para usuario ${user.id}:`, response.data.length);
      setVendors(response.data);
    } catch (err) {
      console.error('Error fetching vendors:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    console.log('Products input change:', { name, value, type });
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Preparar datos para envío - convertir números
      const dataToSend = {
        ...formData,
        Inventory: formData.Inventory === '' ? 0 : parseFloat(formData.Inventory),
        UnitCost: formData.UnitCost === '' ? 0 : parseFloat(formData.UnitCost),
        LastDirectCost: formData.LastDirectCost === '' ? 0 : parseFloat(formData.LastDirectCost),
        UnitPrice: formData.UnitPrice === '' ? 0 : parseFloat(formData.UnitPrice),
        VendorNo: formData.VendorNo || null, // Enviar null si está vacío
      };
      
      console.log('Enviando datos del producto para usuario:', user.id, dataToSend);
      
      if (editingProduct) {
        await itemService.update(editingProduct['No_'], dataToSend);
        setProducts(products.map(p => 
          p['No_'] === editingProduct['No_'] ? { ...p, ...dataToSend } : p
        ));
        console.log(`Producto ${editingProduct['No_']} actualizado para usuario ${user.id}`);
      } else {
        const response = await itemService.create(dataToSend);
        console.log('Respuesta del servidor:', response);
        console.log('Recargando lista de productos...');
        await fetchProducts();
        console.log(`Producto ${formData.No_} creado para usuario ${user.id}`);
      }
      
      resetForm();
    } catch (err) {
      setError(`Error al guardar producto: ${err.response?.data?.message || err.message}`);
      console.error('Error saving product:', err);
      console.error('Error response:', err.response?.data);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({ 
      ...product,
      Inventory: product.Inventory?.toString() || '',
      UnitCost: product.UnitCost?.toString() || '',
      LastDirectCost: product.LastDirectCost?.toString() || '',
      UnitPrice: product.UnitPrice?.toString() || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await itemService.delete(productId);
        setProducts(products.filter(p => p['No_'] !== productId));
        console.log(`Producto ${productId} eliminado para usuario ${user.id}`);
      } catch (err) {
        setError(`Error al eliminar producto: ${err.response?.data?.message || err.message}`);
        console.error('Error deleting product:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      No_: '',
      Description: '',
      Description2: '',
      BaseUnitOfMeasure: 'UND',
      Inventory: '',
      UnitCost: '',
      LastDirectCost: '',
      UnitPrice: '',
      ItemCategoryCode: '',
      ProductGroupCode: '',
      InventoryPostingGroup: 'INV01',
      VendorNo: '',
      Blocked: 'No',
      CreatedAt: new Date().toISOString()
    });
    setEditingProduct(null);
    setShowForm(false);
    setError(null);
  };

  if (loading) return <div className="loading">Cargando productos...</div>;

  return (
    <div className="products">
      <Header title={`Gestión de Productos - ${user?.firstName || 'Usuario'}`} />
      
      {/* ✅ MOVER botón fuera del Header */}
      <div className="page-actions">
        <Button onClick={() => setShowForm(true)}>+ Nuevo Producto</Button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <button onClick={resetForm} className="close-button">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-grid">
                <Input
                  label="Código"
                  name="No_"
                  value={formData.No_}
                  onChange={handleInputChange}
                  required
                  disabled={editingProduct}
                />
                
                <Input
                  label="Descripción"
                  name="Description"
                  value={formData.Description}
                  onChange={handleInputChange}
                  required
                />
                
                <Input
                  label="Descripción 2"
                  name="Description2"
                  value={formData.Description2}
                  onChange={handleInputChange}
                />
                
                <Input
                  label="Unidad de Medida"
                  name="BaseUnitOfMeasure"
                  value={formData.BaseUnitOfMeasure}
                  onChange={handleInputChange}
                />
                
                <Input
                  label="Inventario"
                  name="Inventory"
                  type="number"
                  min="0"
                  value={formData.Inventory}
                  onChange={handleInputChange}
                  placeholder="0"
                />
                
                <Input
                  label="Costo Unitario"
                  name="UnitCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.UnitCost}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
                
                <Input
                  label="Último Costo Directo"
                  name="LastDirectCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.LastDirectCost}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
                
                <Input
                  label="Precio Unitario"
                  name="UnitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.UnitPrice}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  required
                />
                
                <div className="input_group">
                  <label className="input-label">Proveedor</label>
                  <select
                    name="VendorNo"
                    value={formData.VendorNo}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="">Sin proveedor</option>
                    {vendors.map(vendor => (
                      <option key={vendor['No_']} value={vendor['No_']}>
                        {vendor.Name} ({vendor['No_']})
                      </option>
                    ))}
                  </select>
                </div>
                
                <Input
                  label="Categoría"
                  name="ItemCategoryCode"
                  value={formData.ItemCategoryCode}
                  onChange={handleInputChange}
                />
                
                <Input
                  label="Grupo de Producto"
                  name="ProductGroupCode"
                  value={formData.ProductGroupCode}
                  onChange={handleInputChange}
                />
                
                <div className="input-group">
                  <label className="input-label">Estado</label>
                  <select
                    name="Blocked"
                    value={formData.Blocked}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="No">Activo</option>
                    <option value="Yes">Bloqueado</option>
                  </select>
                </div>
              </div>
              
              <div className="form-actions">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProduct ? 'Actualizar' : 'Crear'} Producto
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>Inventario</th>
              <th>Precio Unitario</th>
              <th>Proveedor</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product['No_']}>
                <td className="product-code">{product['No_']}</td>
                <td>
                  <div className="product-info">
                    <div className="product-name">{product.Description}</div>
                    {product['Description 2'] && (
                      <div className="product-subtitle">{product['Description 2']}</div>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`inventory ${product.Inventory < 10 ? 'low' : ''}`}>
                    {product.Inventory} {product['Base Unit of Measure'] || 'UND'}
                  </span>
                </td>
                <td className="price">${product['Unit Price']?.toLocaleString()}</td>
                <td>{product['Vendor No_'] || '-'}</td>
                <td>
                  <span className={`status ${product.Blocked === 'No' ? 'active' : 'blocked'}`}>
                    {product.Blocked === 'No' ? 'Activo' : 'Bloqueado'}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <Button 
                      variant="outline" 
                      size="small"
                      onClick={() => handleEdit(product)}
                    >
                      Editar
                    </Button>
                    <Button 
                      variant="error" 
                      size="small"
                      onClick={() => handleDelete(product['No_'])}
                    >
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {products.length === 0 && (
          <div className="empty-state">
            <p>No tienes productos registrados</p>
            <Button onClick={() => setShowForm(true)}>+ Agregar primer producto</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
