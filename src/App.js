import React from 'react';
import Firebase from 'firebase';
import config from './config';
import './App.css';
import Swal from 'sweetalert2';

class App extends React.Component {

  constructor(props){
    super(props);
    Firebase.initializeApp(config);

    this.state = {
      items: [],
      images:[],
      name: '',
      role: '',
      image: null,
    }
  }

  componentDidMount() {
    this.getUserData();
    // this.getImagesData();
  }

  getImagesData = () => {
    console.log('fn called'); 
    var imagesUrllArray = [];
    let storageRef = Firebase.storage().ref('/images');
    storageRef.listAll()
    .then(function(result) {
      result.items.forEach((imageRef) => {
        imageRef.getDownloadURL()
        .then(function(url) {
          imagesUrllArray.push(url);
        }).catch(function(error) {
          console.log('Error fetching image URL')
        });
      })
    }).catch(function(error) {
      // Handle any errors
    });
    this.setState({
      images: imagesUrllArray
    })
  }
  
  componentDidUpdate(prevProps, prevState) {
    // check on previous state
    // only write when it's different with the new state
    if (prevState !== this.state) {
      this.writeUserData();
    }
  }

  writeUserData = () => {
    Firebase.database().ref('/items').set(this.state.items);
    console.log('DATA SAVED');
  }
  
  getUserData = () => {
    let ref = Firebase.database().ref('/');
    ref.on('value', snapshot => {
      const data = snapshot.val();
      this.setState({
        items: data.items
      }, () => {
        this.getImagesData();
      });
    });
  }

  handleSubmit = (event) => {
    event.preventDefault();
    const storageService = Firebase.storage();
    const storageRef = storageService.ref();
    const { image } = this.state;
    // let name = this.refs.name.value;
    // let role = this.refs.role.value;

      if(image) { //fn to upload image
      const uploadTask = storageRef.child(`images/${image.name}`).put(image); //create a child directory called images, and place the file inside this directory
      uploadTask.on('state_changed', (snapshot) => {
      // Observe state change events such as progress, pause, and resume
      }, (error) => {
        // Handle unsuccessful uploads
        console.log(error);
      }, () => {
         // Do something once upload is complete
         console.log('success');
      });
    }

    let name = this.state.name;
    let role = this.state.role;
    let uid = this.refs.uid.value;
    
    if (uid && name && role){
      const { items } = this.state;
      const devIndex = items.findIndex(data => {
        return data.uid === uid 
      });
      items[devIndex].name = name;
      items[devIndex].role = role;
      items[devIndex].image = image;
      this.setState({ items });
      Swal.fire(
        'Item Updated!',
        'Item updated successfully!',
        'success'
      )
    }
    else if (name && role ) {
      const uid = new Date().getTime().toString();
      const { items } = this.state;
      items.push({ uid, name, role })
      this.setState({ items });
      Swal.fire(
        'Item Added!',
        'Item added successfully!',
        'success'
      )
    }
  
    // this.refs.name.value = '';
    // this.refs.role.value = '';
    // this.refs.uid.value = '';
    this.setState({
      name: '',
      role: '',
      image: null,
    })
  }
  
  removeData = (item) => {
    const { items } = this.state;
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.value) {
        const newState = items.filter(data => {
          return data.uid !== item.uid;
        });
        this.setState({ items: newState });
        Swal.fire(
          'Deleted!',
          'Your file has been deleted.',
          'success'
        )
      }
    })
    // const newState = items.filter(data => {
    //   return data.uid !== item.uid;
    // });
    // this.setState({ items: newState });
  }
  
  updateData = (item) => {
    this.refs.uid.value = item.uid;
    // this.refs.name.value = item.name;
    // this.refs.role.value = item.role;\
    this.setState({
      name: item.name,
      role: item.role,
    })
  }

  handleInputChange = (event) => {
    const { name, value } = event.target;
    this.setState({
      [name]: value
    })
  }

handleImageFile = (event) => {
  this.setState({
    image: event.target.files[0]
  })

}

  render() {
    const { items, images } = this.state;
    console.log(this.state);
    return(
      <div className="container">
        <div className="row my-3 text-center">
          <div className='col-xl-12 '>
            <h1>ThirdLove Admin Dashboard</h1>
          </div>
        </div>
        <div className='row'>
          <div className='col-xl-12'>
          { 
            items
            .map(item => 
              <div key={item.uid} className="card float-left my-3 mr-3" style={{width: '18rem'}}>
                <div className="card-body">
                  <h5 className="card-title">{ item.name }</h5>
                  <p className="card-text">{ item.role }</p>
                  <p className="card-text">Total Images: { images ? images.length : 'No Images yet...' }</p>
                  <button onClick={ () => this.removeData(item) } className="btn btn-danger mr-2">Delete</button>
                  <button onClick={ () => this.updateData(item) } className="btn btn-primary mr-2">Edit</button>
                </div>
              </div>
              )
          } 
          </div>
        </div>
        <div className='row mb-3'>
          <div className='col-xl-12'>
            <h1>Add new item here</h1>
            <form onSubmit={ this.handleSubmit }>
              <div className="form-row">
                <input type='hidden' ref='uid' />
                <div className="form-group col-md-6">
                  <label>Name</label>
                  <input type="text" name="name" ref='name' className="form-control" placeholder="Name" value={this.state.name} onChange={this.handleInputChange} />
                </div>
                <div className="form-group col-md-6">
                  <label>Role</label>
                  <input type="text" name="role" ref='role' className="form-control" placeholder="Role" value={this.state.role} onChange={this.handleInputChange} />
                </div>
                <div className="form-group col-md-6">
                  <label>Image</label>
                  <input type="file" className="form-control file-select" accept="image/*" onChange={this.handleImageFile}/>
                </div>
              </div>
              <div className="">
                <button type="submit" className="btn btn-lg btn-success">Save</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }
}

export default App;
