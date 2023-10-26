pub fn add(left: usize, right: usize) -> usize {
    left + right
}

pub fin compute_bounding_sphere() -> (i32, i32, i32) {

}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}
